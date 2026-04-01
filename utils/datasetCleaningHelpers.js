const { isEmptyValue, parseNumber, detectNumericColumns } = require("./datasetShared");

const applyCleaningOperations = (rows, columnNames, operations = []) => {
  let nextRows = [...rows];
  const cleaningSummary = [];
  const uniqueOperations = [...new Set(operations)];
  const numericColumns = detectNumericColumns(nextRows, columnNames);

  if (uniqueOperations.includes("dropDuplicates")) {
    const seen = new Set();
    const beforeCount = nextRows.length;

    nextRows = nextRows.filter((row) => {
      const signature = JSON.stringify(row);

      if (seen.has(signature)) {
        return false;
      }

      seen.add(signature);
      return true;
    });

    cleaningSummary.push(`Removed ${beforeCount - nextRows.length} duplicate rows.`);
  }

  if (uniqueOperations.includes("removeMissingRows")) {
    const beforeCount = nextRows.length;

    nextRows = nextRows.filter((row) =>
      columnNames.every((columnName) => !isEmptyValue(row[columnName]))
    );

    cleaningSummary.push(`Removed ${beforeCount - nextRows.length} rows with missing values.`);
  }

  if (uniqueOperations.includes("fillNumericMean")) {
    numericColumns.forEach((columnName) => {
      const values = nextRows
        .map((row) => parseNumber(row[columnName]))
        .filter((value) => value !== null);

      if (!values.length) {
        return;
      }

      const mean = values.reduce((sum, value) => sum + value, 0) / values.length;

      nextRows = nextRows.map((row) =>
        isEmptyValue(row[columnName])
          ? { ...row, [columnName]: Number(mean.toFixed(2)) }
          : row
      );
    });

    cleaningSummary.push("Filled missing numeric values with the column mean.");
  }

  if (uniqueOperations.includes("normalizeText")) {
    nextRows = nextRows.map((row) => {
      const nextRow = { ...row };

      columnNames.forEach((columnName) => {
        const value = nextRow[columnName];

        if (typeof value === "string") {
          nextRow[columnName] = value.trim().replace(/\s+/g, " ");
        }
      });

      return nextRow;
    });

    cleaningSummary.push("Normalized text spacing across string columns.");
  }

  uniqueOperations
    .filter((operation) => typeof operation === "object" && operation?.type === "fillMissingDefault")
    .forEach((operation) => {
      const targetColumn = operation.column;
      const fillValue = operation.value ?? "N/A";

      if (!targetColumn) {
        return;
      }

      nextRows = nextRows.map((row) =>
        isEmptyValue(row[targetColumn]) ? { ...row, [targetColumn]: fillValue } : row
      );

      cleaningSummary.push(`Filled missing values in ${targetColumn} with ${fillValue}.`);
    });

  uniqueOperations
    .filter((operation) => typeof operation === "object" && operation?.type === "renameColumn")
    .forEach((operation) => {
      const { from, to } = operation;

      if (!from || !to || from === to || !columnNames.includes(from)) {
        return;
      }

      const targetIndex = columnNames.indexOf(from);
      columnNames[targetIndex] = to;

      nextRows = nextRows.map((row) => {
        const nextRow = { ...row };
        nextRow[to] = nextRow[from];
        delete nextRow[from];
        return nextRow;
      });

      cleaningSummary.push(`Renamed column ${from} to ${to}.`);
    });

  uniqueOperations
    .filter((operation) => typeof operation === "object" && operation?.type === "deleteColumn")
    .forEach((operation) => {
      const targetColumn = operation.column;

      if (!targetColumn || !columnNames.includes(targetColumn)) {
        return;
      }

      const targetIndex = columnNames.indexOf(targetColumn);
      columnNames.splice(targetIndex, 1);

      nextRows = nextRows.map((row) => {
        const nextRow = { ...row };
        delete nextRow[targetColumn];
        return nextRow;
      });

      cleaningSummary.push(`Deleted column ${targetColumn}.`);
    });

  return {
    cleanedRows: nextRows,
    cleanedColumnNames: columnNames,
    cleaningSummary,
  };
};

module.exports = {
  applyCleaningOperations,
};
