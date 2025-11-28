const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

class ExcelFormulaGenerator {
    constructor(assemblyListPath, partListPath, templatePath) {
        this.assemblyListPath = assemblyListPath;
        this.partListPath = partListPath;
        this.templatePath = templatePath;

        // Usa percorsi assoluti completi per le formule Excel
        // Converti backslash in forward slash per compatibilità Excel
        this.assemblyListFullPath = assemblyListPath.replace(/\\/g, '/');
        this.partListFullPath = partListPath.replace(/\\/g, '/');

        this.stats = {
            totalAssemblies: 0,
            totalParts: 0,
            totalFormulas: 0,
            totalWeight: 0,
            verifications: []
        };
    }

    async generate(progressCallback) {
        try {
            // Step 1: Carica i file
            progressCallback('Caricamento file...', 10);
            const assemblyWb = new ExcelJS.Workbook();
            const partWb = new ExcelJS.Workbook();
            const templateWb = new ExcelJS.Workbook();

            await assemblyWb.xlsx.readFile(this.assemblyListPath);
            await partWb.xlsx.readFile(this.partListPath);
            await templateWb.xlsx.readFile(this.templatePath);

            const assemblySheet = assemblyWb.getWorksheet('Data');
            const partSheet = partWb.getWorksheet('Data');
            const templateSheet = templateWb.getWorksheet('Data');

            progressCallback('File caricati con successo', 20);

            // Step 2: Crea mappa degli assembly e parts per lookup veloce
            progressCallback('Creazione mappe lookup...', 30);
            const assemblyMap = this.buildAssemblyMap(assemblySheet);
            const partMap = this.buildPartMap(partSheet);

            // Step 3: Crea nuovo workbook output
            progressCallback('Creazione workbook output...', 40);
            const outputWb = new ExcelJS.Workbook();
            const outputSheet = outputWb.addWorksheet('Data');

            // Step 4: Copia header e struttura dal template
            progressCallback('Copia struttura template...', 50);
            await this.copyTemplateStructure(templateSheet, outputSheet);

            // Step 5: Processa ogni riga e crea formule
            progressCallback('Generazione formule...', 60);
            await this.processRows(templateSheet, outputSheet, assemblyMap, partMap);

            // Step 6: Verifica i calcoli
            progressCallback('Verifica calcoli...', 80);
            await this.verifyCalculations(outputSheet, assemblyMap, partMap);

            // Step 7: Salva il file output
            progressCallback('Salvataggio file...', 90);
            const outputPath = this.generateOutputPath();
            await outputWb.xlsx.writeFile(outputPath);

            progressCallback('Completato!', 100);

            return {
                success: true,
                outputPath: outputPath,
                stats: this.stats
            };

        } catch (error) {
            console.error('Errore durante la generazione:', error);
            throw error;
        }
    }

    buildAssemblyMap(sheet) {
        const map = new Map();

        sheet.eachRow((row, rowNum) => {
            if (rowNum <= 18) return; // Skip header

            const assemblyPos = row.getCell(2).value;
            if (assemblyPos && assemblyPos !== 'TOTAL') {
                map.set(assemblyPos, {
                    rowNum: rowNum,
                    qty: row.getCell(3).value,
                    type: row.getCell(4).value,
                    profile: row.getCell(5).value,
                    length: row.getCell(6).value,
                    weight: row.getCell(7).value,
                    totalWeight: row.getCell(8).value,
                    area: row.getCell(9).value,
                    totalArea: row.getCell(10).value
                });
            }
        });

        this.stats.totalAssemblies = map.size;
        return map;
    }

    buildPartMap(sheet) {
        const map = new Map();

        sheet.eachRow((row, rowNum) => {
            if (rowNum <= 18) return; // Skip header

            const partPos = row.getCell(2).value;
            if (partPos && partPos !== 'TOTAL') {
                map.set(partPos, {
                    rowNum: rowNum,
                    qty: row.getCell(3).value,
                    type: row.getCell(4).value,
                    profile: row.getCell(5).value,
                    grade: row.getCell(6).value,
                    length: row.getCell(7).value,
                    weight: row.getCell(8).value,
                    totalWeight: row.getCell(9).value,
                    totalArea: row.getCell(10).value
                });
            }
        });

        this.stats.totalParts = map.size;
        return map;
    }

    async copyTemplateStructure(templateSheet, outputSheet) {
        // Copia le prime 17 righe (header) esattamente come sono
        for (let rowNum = 1; rowNum <= 17; rowNum++) {
            const templateRow = templateSheet.getRow(rowNum);
            const outputRow = outputSheet.getRow(rowNum);

            // Copia altezza
            if (templateRow.height) {
                outputRow.height = templateRow.height;
            }

            // Copia ogni cella
            templateRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
                const outputCell = outputRow.getCell(colNum);

                // Copia valore
                if (cell.value !== null && cell.value !== undefined) {
                    outputCell.value = cell.value;
                }

                // Copia stile
                if (cell.style) {
                    outputCell.style = JSON.parse(JSON.stringify(cell.style));
                }
            });

            outputRow.commit();
        }

        // Copia larghezze colonne
        for (let colNum = 1; colNum <= templateSheet.columnCount; colNum++) {
            const templateCol = templateSheet.getColumn(colNum);
            const outputCol = outputSheet.getColumn(colNum);

            if (templateCol.width) {
                outputCol.width = templateCol.width;
            }
        }

        // Copia merged cells per le prime 17 righe
        if (templateSheet.model.merges) {
            templateSheet.model.merges.forEach(merge => {
                const match = merge.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
                if (match) {
                    const startRow = parseInt(match[2]);
                    if (startRow <= 17) {
                        outputSheet.mergeCells(merge);
                    }
                }
            });
        }
    }

    async processRows(templateSheet, outputSheet, assemblyMap, partMap) {
        let currentOutputRow = 18; // Start dopo l'header
        let formulaCount = 0;
        const assemblyWeightRows = []; // Traccia le righe con i pesi degli assembly

        templateSheet.eachRow((row, rowNum) => {
            if (rowNum <= 18) return; // Skip header

            currentOutputRow++;
            const outputRow = outputSheet.getRow(currentOutputRow);

            // Copia proprietà riga
            if (row.height) outputRow.height = row.height;

            const colA = row.getCell(1).value;
            const colB = row.getCell(2).value; // Assembly pos
            const colC = row.getCell(3).value; // Part pos
            const colD = row.getCell(4).value; // Qty (template)

            // Copia colonna A (sempre "-")
            outputRow.getCell(1).value = colA || '-';

            // CASO 1: Riga Assembly (colB pieno, colC vuoto)
            if (colB && colB !== '-' && (!colC || colC === '-')) {
                this.createAssemblyRow(outputRow, colB, assemblyMap);
                assemblyWeightRows.push(currentOutputRow); // Traccia questa riga per la somma
                formulaCount += 2; // Qty + Weight
            }
            // CASO 2: Riga Part (colC pieno)
            else if (colC && colC !== '-') {
                this.createPartRow(outputRow, colC, colD, partMap);
                formulaCount += 5; // Dimension, Grade, Length, Weight, Area
            }
            // CASO 3: Riga vuota/separatore
            else {
                // Copia così com'è
                row.eachCell({ includeEmpty: true }, (cell, colNum) => {
                    const outputCell = outputRow.getCell(colNum);
                    if (cell.value !== null && cell.value !== undefined) {
                        outputCell.value = cell.value;
                    }
                });
            }

            outputRow.commit();
        });

        // Aggiungi riga TOTAL alla fine
        if (assemblyWeightRows.length > 0) {
            currentOutputRow += 2; // Salta una riga
            const totalRow = outputSheet.getRow(currentOutputRow);

            // Colonna A: "-"
            totalRow.getCell(1).value = '-';

            // Colonna B: "TOTAL ASSEMBLIES"
            totalRow.getCell(2).value = 'TOTAL ASSEMBLIES';
            totalRow.getCell(2).font = { bold: true };

            // Colonna H: Formula SUM dei pesi (Qty × Peso unitario per ogni assembly)
            const sumCells = assemblyWeightRows.map(r => `D${r}*H${r}`).join(',');
            totalRow.getCell(8).value = { formula: `SUM(${sumCells})` };
            totalRow.getCell(8).font = { bold: true };
            totalRow.getCell(8).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFEB3B' } // Giallo
            };

            totalRow.commit();
            formulaCount++; // Conta la formula SUM
        }

        this.stats.totalFormulas = formulaCount;

        // Calcola peso totale (Qty × Peso unitario per ogni assembly)
        this.stats.totalWeight = 0;
        assemblyMap.forEach((data, assemblyPos) => {
            const qty = data.qty || 0;
            const weight = data.weight || 0;
            this.stats.totalWeight += qty * weight;
        });
    }

    createAssemblyRow(outputRow, assemblyPos, assemblyMap) {
        const assemblyData = assemblyMap.get(assemblyPos);

        // Col B: Assembly position (valore statico dal template)
        outputRow.getCell(2).value = assemblyPos;

        // Col C: vuoto
        outputRow.getCell(3).value = null;

        // Col D: Qty (FORMULA che cerca in ASSEMBLY_LIST con percorso assoluto)
        if (assemblyData) {
            const formula = `VLOOKUP("${assemblyPos}",'${this.assemblyListFullPath}'!$B:$C,2,0)`;
            outputRow.getCell(4).value = { formula: formula };
        } else {
            outputRow.getCell(4).value = '-';
        }

        // Col E, F, G: vuote
        outputRow.getCell(5).value = null;
        outputRow.getCell(6).value = null;
        outputRow.getCell(7).value = null;

        // Col H: Weight (FORMULA con percorso assoluto)
        if (assemblyData) {
            const formula = `VLOOKUP("${assemblyPos}",'${this.assemblyListFullPath}'!$B:$G,6,0)`;
            outputRow.getCell(8).value = { formula: formula };
        } else {
            outputRow.getCell(8).value = '-';
        }

        // Col I: Area (di solito "-" per assembly)
        outputRow.getCell(9).value = '-';
    }

    createPartRow(outputRow, partPos, qtyTemplate, partMap) {
        const partData = partMap.get(partPos);

        // Col B: vuoto
        outputRow.getCell(2).value = null;

        // Col C: Part position (valore statico dal template)
        outputRow.getCell(3).value = partPos;

        // Col D: Qty (VALORE STATICO dal template - è la qty specifica per questo assembly)
        outputRow.getCell(4).value = qtyTemplate || '-';

        // Col E: Dimension (FORMULA che cerca in PART_LIST con percorso assoluto)
        if (partData) {
            const formula = `VLOOKUP("${partPos}",'${this.partListFullPath}'!$B:$E,4,0)`;
            outputRow.getCell(5).value = { formula: formula };
        } else {
            outputRow.getCell(5).value = '-';
        }

        // Col F: Grade (FORMULA con percorso assoluto)
        if (partData) {
            const formula = `VLOOKUP("${partPos}",'${this.partListFullPath}'!$B:$F,5,0)`;
            outputRow.getCell(6).value = { formula: formula };
        } else {
            outputRow.getCell(6).value = '-';
        }

        // Col G: Length (FORMULA o "-" con percorso assoluto)
        if (partData && partData.length && partData.length !== '-') {
            const formula = `VLOOKUP("${partPos}",'${this.partListFullPath}'!$B:$G,6,0)`;
            outputRow.getCell(7).value = { formula: formula };
        } else {
            outputRow.getCell(7).value = '-';
        }

        // Col H: Weight (FORMULA - peso unitario × qty specifica con percorso assoluto)
        if (partData && qtyTemplate && qtyTemplate !== '-') {
            const weightFormula = `VLOOKUP("${partPos}",'${this.partListFullPath}'!$B:$H,7,0)`;
            const formula = `${qtyTemplate}*${weightFormula}`;
            outputRow.getCell(8).value = { formula: formula };
        } else {
            outputRow.getCell(8).value = '-';
        }

        // Col I: Area (CALCOLATA o da PART_LIST con percorso assoluto)
        // Per semplicità, usiamo una formula simile
        if (partData) {
            const formula = `ROUND(${qtyTemplate}*VLOOKUP("${partPos}",'${this.partListFullPath}'!$B:$H,7,0)/VLOOKUP("${partPos}",'${this.partListFullPath}'!$B:$C,2,0)*VLOOKUP("${partPos}",'${this.partListFullPath}'!$B:$J,9,0)/${qtyTemplate},2)`;
            outputRow.getCell(9).value = { formula: formula };
        } else {
            outputRow.getCell(9).value = '-';
        }
    }

    async verifyCalculations(outputSheet, assemblyMap, partMap) {
        // Verifica esempio: B2006
        const verification = {
            assembly: 'B2006',
            assemblyWeight: null,
            partsWeightSum: 0,
            parts: [],
            difference: 0,
            status: 'OK'
        };

        let foundAssembly = false;
        let assemblyRow = null;

        outputSheet.eachRow((row, rowNum) => {
            if (rowNum <= 18) return;

            const colB = row.getCell(2).value;
            const colC = row.getCell(3).value;
            const colH = row.getCell(8).value;

            // Trova B2006 assembly
            if (colB === 'B2006') {
                foundAssembly = true;
                assemblyRow = rowNum;

                // Peso dell'assembly (dalla formula o dal valore)
                if (typeof colH === 'object' && colH.formula) {
                    // Simula il valore calcolato dalla formula
                    const assemblyData = assemblyMap.get('B2006');
                    verification.assemblyWeight = assemblyData ? assemblyData.weight : 0;
                } else {
                    verification.assemblyWeight = colH;
                }
            }
            // Raccogli i parts di B2006
            else if (foundAssembly && colC && colC !== '-') {
                const partData = partMap.get(colC);
                const qtyTemplate = row.getCell(4).value;

                if (partData && qtyTemplate && qtyTemplate !== '-') {
                    const partWeight = qtyTemplate * partData.weight;
                    verification.partsWeightSum += partWeight;
                    verification.parts.push({
                        part: colC,
                        qty: qtyTemplate,
                        unitWeight: partData.weight,
                        totalWeight: partWeight
                    });
                }
            }
            // Fine dei parts di B2006 (riga vuota)
            else if (foundAssembly && (!colB || colB === '-') && (!colC || colC === '-')) {
                foundAssembly = false;
            }
        });

        verification.difference = Math.abs(verification.assemblyWeight - verification.partsWeightSum);
        verification.status = verification.difference < 1 ? 'OK' : 'ATTENZIONE';

        this.stats.verifications.push(verification);
    }

    generateOutputPath() {
        const dir = path.dirname(this.templatePath);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        return path.join(dir, `ASSEMBLY_PART_LIST_WITH_FORMULAS_${timestamp}.xlsx`);
    }
}

module.exports = ExcelFormulaGenerator;
