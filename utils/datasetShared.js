const isEmptyValue = (value) =>
  value === null || value === undefined || String(value).trim() === "";

const toComparableString = (value) =>
  value === null || value === undefined ? "" : String(value).trim().toLowerCase();

const parseNumber = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (isEmptyValue(value)) {
    return null;
  }

  const normalized = String(value).replace(/,/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const inferColumnType = (rows, columnName) => {
  const values = rows.map((row) => row[columnName]).filter((value) => !isEmptyValue(value));

  if (!values.length) {
    return "empty";
  }

  if (values.every((value) => parseNumber(value) !== null)) {
    return "number";
  }

  if (
    values.every(
      (value) =>
        typeof value === "boolean" ||
        ["true", "false", "yes", "no"].includes(toComparableString(value))
    )
  ) {
    return "boolean";
  }

  return "string";
};

const detectNumericColumns = (rows, columnNames) =>
  columnNames.filter((columnName) => {
    const nonEmptyValues = rows
      .map((row) => row[columnName])
      .filter((value) => !isEmptyValue(value));

    if (!nonEmptyValues.length) {
      return false;
    }

    return nonEmptyValues.every((value) => parseNumber(value) !== null);
  });

module.exports = {
  isEmptyValue,
  toComparableString,
  parseNumber,
  inferColumnType,
  detectNumericColumns,
};
