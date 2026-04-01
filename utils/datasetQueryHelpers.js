const {
  isEmptyValue,
  toComparableString,
  parseNumber,
} = require("./datasetShared");

const applySearch = (rows, search) => {
  if (!search?.trim()) {
    return rows;
  }

  const normalizedSearch = search.trim().toLowerCase();

  return rows.filter((row) =>
    Object.values(row).some((value) => toComparableString(value).includes(normalizedSearch))
  );
};

const compareValues = (leftValue, rightValue, numeric = false) => {
  if (numeric) {
    return (parseNumber(leftValue) ?? 0) - (parseNumber(rightValue) ?? 0);
  }

  return toComparableString(leftValue).localeCompare(toComparableString(rightValue));
};

const applySort = (rows, sortBy, sortOrder, numericColumns) => {
  if (!sortBy) {
    return rows;
  }

  const direction = sortOrder === "desc" ? -1 : 1;
  const isNumericColumn = numericColumns.includes(sortBy);

  return [...rows].sort(
    (leftRow, rightRow) =>
      compareValues(leftRow[sortBy], rightRow[sortBy], isNumericColumn) * direction
  );
};

const matchesFilter = (rowValue, filterOperator, filterValue, numericColumns, filterColumn) => {
  const isNumericColumn = numericColumns.includes(filterColumn);

  if (filterOperator === "contains") {
    return toComparableString(rowValue).includes(toComparableString(filterValue));
  }

  if (filterOperator === "equals") {
    return toComparableString(rowValue) === toComparableString(filterValue);
  }

  if (filterOperator === "isEmpty") {
    return isEmptyValue(rowValue);
  }

  if (filterOperator === "isNotEmpty") {
    return !isEmptyValue(rowValue);
  }

  const numericRowValue = parseNumber(rowValue);
  const numericFilterValue = parseNumber(filterValue);

  if (!isNumericColumn || numericRowValue === null || numericFilterValue === null) {
    return true;
  }

  if (filterOperator === "gt") {
    return numericRowValue > numericFilterValue;
  }

  if (filterOperator === "gte") {
    return numericRowValue >= numericFilterValue;
  }

  if (filterOperator === "lt") {
    return numericRowValue < numericFilterValue;
  }

  if (filterOperator === "lte") {
    return numericRowValue <= numericFilterValue;
  }

  return true;
};

const applyFilter = (rows, query, numericColumns) => {
  const { filterColumn, filterOperator, filterValue } = query;

  if (!filterColumn || !filterOperator) {
    return rows;
  }

  return rows.filter((row) =>
    matchesFilter(row[filterColumn], filterOperator, filterValue, numericColumns, filterColumn)
  );
};

const paginateRows = (rows, page = 1, limit = 10) => {
  const normalizedPage = Math.max(Number(page) || 1, 1);
  const normalizedLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const startIndex = (normalizedPage - 1) * normalizedLimit;

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    totalRows: rows.length,
    totalPages: Math.max(Math.ceil(rows.length / normalizedLimit), 1),
    rows: rows.slice(startIndex, startIndex + normalizedLimit),
  };
};

module.exports = {
  applyFilter,
  applySearch,
  applySort,
  paginateRows,
};
