const {
  isEmptyValue,
  toComparableString,
  parseNumber,
  inferColumnType,
  detectNumericColumns,
} = require("./datasetShared");

const countMissingValues = (rows, columnNames) =>
  columnNames.map((columnName) => ({
    column: columnName,
    missingCount: rows.filter((row) => isEmptyValue(row[columnName])).length,
  }));

const getMode = (values) => {
  if (!values.length) {
    return null;
  }

  const counts = new Map();
  values.forEach((value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0][0];
};

const getMedian = (values) => {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Number(((sorted[midpoint - 1] + sorted[midpoint]) / 2).toFixed(2));
  }

  return sorted[midpoint];
};

const getVariance = (values, mean) => {
  if (!values.length) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + (value - mean) ** 2, 0);
  return Number((total / values.length).toFixed(2));
};

const getStandardDeviation = (variance) => Number(Math.sqrt(variance).toFixed(2));

const getCorrelation = (firstValues, secondValues) => {
  if (!firstValues.length || firstValues.length !== secondValues.length) {
    return 0;
  }

  const firstMean = firstValues.reduce((sum, value) => sum + value, 0) / firstValues.length;
  const secondMean = secondValues.reduce((sum, value) => sum + value, 0) / secondValues.length;

  const numerator = firstValues.reduce(
    (sum, value, index) => sum + (value - firstMean) * (secondValues[index] - secondMean),
    0
  );

  const firstDenominator = Math.sqrt(
    firstValues.reduce((sum, value) => sum + (value - firstMean) ** 2, 0)
  );
  const secondDenominator = Math.sqrt(
    secondValues.reduce((sum, value) => sum + (value - secondMean) ** 2, 0)
  );

  if (!firstDenominator || !secondDenominator) {
    return 0;
  }

  return Number((numerator / (firstDenominator * secondDenominator)).toFixed(3));
};

const countDuplicateRows = (rows) => {
  const seen = new Map();
  let duplicates = 0;

  rows.forEach((row) => {
    const signature = JSON.stringify(row);
    const currentCount = seen.get(signature) || 0;
    seen.set(signature, currentCount + 1);

    if (currentCount >= 1) {
      duplicates += 1;
    }
  });

  return duplicates;
};

const detectFormatIssues = (rows, columnNames) =>
  columnNames.flatMap((columnName) => {
    const normalizedValues = rows
      .map((row) => row[columnName])
      .filter((value) => !isEmptyValue(value))
      .map((value) => String(value).trim());

    const hasMixedCase =
      normalizedValues.some((value) => value !== value.toLowerCase()) &&
      normalizedValues.some((value) => value !== value.toUpperCase());

    const hasWhitespaceIssues = normalizedValues.some(
      (value) => value !== value.trim() || /\s{2,}/.test(value)
    );

    const issues = [];

    if (hasMixedCase) {
      issues.push({
        column: columnName,
        issue: "Inconsistent capitalization detected",
      });
    }

    if (hasWhitespaceIssues) {
      issues.push({
        column: columnName,
        issue: "Extra spacing or inconsistent whitespace detected",
      });
    }

    return issues;
  });

const buildCleaningSuggestions = (rows, columnNames) => {
  const missingValues = countMissingValues(rows, columnNames);
  const duplicateRows = countDuplicateRows(rows);
  const numericColumns = detectNumericColumns(rows, columnNames);
  const formatIssues = detectFormatIssues(rows, columnNames);
  const suggestions = [];

  missingValues.forEach(({ column, missingCount }) => {
    if (!missingCount) {
      return;
    }

    if (numericColumns.includes(column)) {
      suggestions.push({
        type: "fillNumericMean",
        column,
        title: `Column ${column} has ${missingCount} missing values`,
        description: `Suggested action: fill missing values in ${column} with the mean.`,
      });
      return;
    }

    suggestions.push({
      type: "removeMissingRows",
      column,
      title: `Column ${column} has ${missingCount} missing values`,
      description: `Suggested action: remove rows where ${column} is empty.`,
    });
  });

  if (duplicateRows) {
    suggestions.push({
      type: "dropDuplicates",
      title: `${duplicateRows} duplicate rows found`,
      description: "Suggested action: remove duplicate rows from the dataset.",
    });
  }

  formatIssues.forEach(({ column, issue }) => {
    suggestions.push({
      type: "normalizeText",
      column,
      title: `${column} format inconsistency detected`,
      description: issue,
    });
  });

  return {
    missingValues,
    duplicateRows,
    numericColumns,
    formatIssues,
    suggestions,
  };
};

const buildNumericSummary = (rows, columnName) => {
  const values = rows.map((row) => parseNumber(row[columnName])).filter((value) => value !== null);

  if (!values.length) {
    return {
      column: columnName,
      sum: 0,
      average: 0,
      median: 0,
      mode: 0,
      minimum: 0,
      maximum: 0,
      variance: 0,
      standardDeviation: 0,
    };
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  const average = total / values.length;
  const variance = getVariance(values, average);

  return {
    column: columnName,
    sum: Number(total.toFixed(2)),
    average: Number(average.toFixed(2)),
    median: getMedian(values),
    mode: getMode(values),
    minimum: Math.min(...values),
    maximum: Math.max(...values),
    variance,
    standardDeviation: getStandardDeviation(variance),
  };
};

const buildCategoricalSummary = (rows, columnName) => {
  const counts = new Map();

  rows.forEach((row) => {
    const value = toComparableString(row[columnName]) || "empty";
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  const sorted = [...counts.entries()].sort((left, right) => right[1] - left[1]);
  const [topValue = "N/A", topCount = 0] = sorted[0] || [];

  return {
    column: columnName,
    topValue,
    topCount,
  };
};

const buildCorrelations = (rows, numericColumns) =>
  numericColumns.flatMap((firstColumn, firstIndex) =>
    numericColumns.slice(firstIndex + 1).map((secondColumn) => {
      const pairs = rows
        .map((row) => [parseNumber(row[firstColumn]), parseNumber(row[secondColumn])])
        .filter(([firstValue, secondValue]) => firstValue !== null && secondValue !== null);

      return {
        columns: [firstColumn, secondColumn],
        value: getCorrelation(
          pairs.map(([firstValue]) => firstValue),
          pairs.map(([, secondValue]) => secondValue)
        ),
      };
    })
  );

const buildStats = (rows, columnNames) => {
  const numericColumns = detectNumericColumns(rows, columnNames);
  const totalRows = rows.length;
  const totalColumns = columnNames.length;
  const missingValues = countMissingValues(rows, columnNames);
  const columnProfiles = columnNames.map((columnName) => {
    const rawValues = rows.map((row) => row[columnName]);
    const nonEmptyValues = rawValues.filter((value) => !isEmptyValue(value));

    return {
      column: columnName,
      dataType: inferColumnType(rows, columnName),
      uniqueValues: new Set(nonEmptyValues.map((value) => String(value))).size,
      missingValues: rawValues.length - nonEmptyValues.length,
    };
  });

  return {
    totalRows,
    totalColumns,
    columnNames,
    missingValues,
    numericColumns,
    columnProfiles,
    numericSummaries: numericColumns.map((columnName) => buildNumericSummary(rows, columnName)),
    categoricalSummaries: columnNames
      .filter((columnName) => !numericColumns.includes(columnName))
      .map((columnName) => buildCategoricalSummary(rows, columnName)),
    correlations: buildCorrelations(rows, numericColumns),
  };
};

const buildInsights = (stats, cleaningSummary) => {
  const insights = [];

  if (stats.totalRows) {
    insights.push(`Dataset contains ${stats.totalRows} rows and ${stats.totalColumns} columns.`);
  }

  stats.numericSummaries.slice(0, 3).forEach((summary) => {
    insights.push(
      `Average ${summary.column} is ${summary.average}, with values ranging from ${summary.minimum} to ${summary.maximum}.`
    );
  });

  stats.categoricalSummaries.slice(0, 2).forEach((summary) => {
    if (summary.topValue !== "empty") {
      insights.push(
        `${summary.column} is led by ${summary.topValue} with ${summary.topCount} records.`
      );
    }
  });

  const columnsWithMissingValues = cleaningSummary.missingValues.filter(
    (item) => item.missingCount > 0
  );

  if (columnsWithMissingValues.length) {
    insights.push(
      `${columnsWithMissingValues.length} columns contain missing values that may need cleaning.`
    );
  }

  if (cleaningSummary.duplicateRows > 0) {
    insights.push(`${cleaningSummary.duplicateRows} duplicate rows were detected in this dataset.`);
  }

  return insights;
};

const buildChartData = (rows, columnNames, preferredNumericColumn, preferredXAxis) => {
  const numericColumns = detectNumericColumns(rows, columnNames);
  const xAxis =
    preferredXAxis ||
    columnNames.find((columnName) => columnName !== preferredNumericColumn) ||
    columnNames[0];
  const yAxis = preferredNumericColumn || numericColumns[0] || columnNames[1] || columnNames[0];
  const xAxisType = inferColumnType(rows, xAxis);
  const isNumericYAxis = numericColumns.includes(yAxis);
  let chartRows = [];
  let pieRows = [];

  if (xAxis && yAxis && xAxis !== yAxis && isNumericYAxis) {
    const groupedValues = rows.reduce((groups, row, index) => {
      const rawLabel = row[xAxis];
      const label = isEmptyValue(rawLabel) ? `Unknown ${index + 1}` : String(rawLabel).trim();
      const numericValue = parseNumber(row[yAxis]);

      if (numericValue === null) {
        return groups;
      }

      const currentGroup = groups.get(label) || { label, total: 0, count: 0 };
      currentGroup.total += numericValue;
      currentGroup.count += 1;
      groups.set(label, currentGroup);

      return groups;
    }, new Map());

    const aggregatedRows = [...groupedValues.values()].map((group) => ({
      label: group.label,
      value: Number((group.total / group.count).toFixed(2)),
      total: Number(group.total.toFixed(2)),
      count: group.count,
    }));

    const sortedRows =
      xAxisType === "number"
        ? aggregatedRows.sort(
            (left, right) => (parseNumber(left.label) ?? 0) - (parseNumber(right.label) ?? 0)
          )
        : aggregatedRows.sort((left, right) => right.value - left.value);

    chartRows = sortedRows.slice(0, 12);
    pieRows = sortedRows
      .filter((row) => row.value > 0)
      .slice(0, 6)
      .map((row) => ({
        name: row.label,
        value: row.value,
      }));
  } else {
    chartRows = rows.slice(0, 12).map((row, index) => ({
      label: String(row[xAxis] ?? `Row ${index + 1}`),
      value: parseNumber(row[yAxis]) ?? 0,
    }));

    pieRows = chartRows
      .filter((row) => row.value > 0)
      .slice(0, 6)
      .map((row) => ({
        name: row.label,
        value: row.value,
      }));
  }

  return {
    xAxis,
    yAxis,
    xAxisType,
    barLineData: chartRows,
    pieData: pieRows,
    numericColumns,
  };
};

module.exports = {
  buildCleaningSuggestions,
  buildStats,
  buildInsights,
  buildChartData,
  countMissingValues,
  countDuplicateRows,
  detectFormatIssues,
};
