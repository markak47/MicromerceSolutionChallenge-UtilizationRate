import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { useMemo } from "react";
import sourceData from "./source-data.json";
import type { SourceDataType, TableDataType } from "./types";

/**
 * Example of how a tableData object should be structured.
 *
 * Each `row` object has the following properties:
 * @prop {string} person - The full name of the employee.
 * @prop {number} past12Months - The value for the past 12 months.
 * @prop {number} y2d - The year-to-date value.
 * @prop {number} may - The value for May.
 * @prop {number} june - The value for June.
 * @prop {number} july - The value for July.
 * @prop {number} netEarningsPrevMonth - The net earnings for the previous month.
 */
const getPrevMonthKey = (): string => {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
};

// helper function to get the net earnings for the previous month
const getNetEarningsPrevMonth = (dataRow: SourceDataType): string => {
  const prevMonthKey = getPrevMonthKey();
  const earningsArr =
    (dataRow.employees?.costsByMonth as any)?.potentialEarningsByMonth ?? [];

  const match = earningsArr.find((e: any) => e.month === prevMonthKey);
  const raw = parseFloat(match?.costs ?? "0");
  return `${raw} €`;
};
// Predicate helpers these functions are used to filter out unwanted data rows so we dont get data inconsistencies
// These functions check if the data row is inactive or has invalid names.
const isInactiveEmployee = (dataRow: SourceDataType): boolean =>
  !!dataRow.employees &&
  dataRow.employees.statusAggregation?.status === "Inaktiv";
const isInactiveExternal = (dataRow: SourceDataType): boolean =>
  !!dataRow.externals && dataRow.externals.status !== "active";
const hasValidName = (person: any): boolean =>
  Boolean(person?.firstname && person?.lastname);
const isValidRow = (dataRow: SourceDataType): boolean => {
  const person = dataRow.employees ?? dataRow.externals;
  return (
    !isInactiveEmployee(dataRow) &&
    !isInactiveExternal(dataRow) &&
    hasValidName(person)
  );
};

// this function extracts the person object from the data row so we can manage the data more easily
const extractPerson = (dataRow: SourceDataType) =>
  dataRow.employees ?? dataRow.externals;

// Refactored map block using functional style for better readability
const tableData: TableDataType[] = (sourceData as unknown as SourceDataType[])
  .filter(isValidRow)
  .map((dataRow) => {
    const person = extractPerson(dataRow);
    const util = person?.workforceUtilisation;

    const parseRate = (value?: string): string =>
      value ? `${(parseFloat(value) * 100).toFixed(1)}%` : "0%";

    const getMonthRate = (month: string) =>
      parseRate(
        util?.lastThreeMonthsIndividually?.find((m) => m.month === month)
          ?.utilisationRate
      );

    if (!person) return null;
    return {
      person: `${person.firstname} ${person.lastname}`,
      past12Months: parseRate(util?.utilisationRateLastTwelveMonths),
      y2d: parseRate(util?.utilisationRateYearToDate),
      may: getMonthRate("May"),
      june: getMonthRate("June"),
      july: getMonthRate("July"),
      netEarningsPrevMonth: getNetEarningsPrevMonth(dataRow),
    };
  })
  .filter((row): row is TableDataType => row !== null);

const Example = () => {
  const columns = useMemo<MRT_ColumnDef<TableDataType>[]>(
    () => [
      {
        accessorKey: "person",
        header: "Person",
      },
      {
        accessorKey: "past12Months",
        header: "Past 12 Months",
      },
      {
        accessorKey: "y2d",
        header: "Y2D",
      },
      {
        accessorKey: "may",
        header: "May",
      },
      {
        accessorKey: "june",
        header: "June",
      },
      {
        accessorKey: "july",
        header: "July",
      },
      {
        accessorKey: "netEarningsPrevMonth",
        header: "Net Earnings Prev Month",
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: tableData,
  });

  return <MaterialReactTable table={table} />;
};

export default Example;
