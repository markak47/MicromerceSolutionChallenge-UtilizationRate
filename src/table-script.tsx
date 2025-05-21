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
/*

- dashboard shows each active person (employees and externals) 
- we can see utilisation year to date, last twelve months, last three months 

| Person     | Past 12 Months | Y2D | May | June | July | Net Earnings Prev Month |
| ---------- | -------------- | --- | --- | ---- | ---- | ----------------------- |
| Person A   | 89%            | ... | ... | 72%  | ...  | 3500 EUR                |
| External D | ...            | ... | ... | 72%  | ...  | -1980 EUR               |

### ✅ Acceptance Criteria

- All fields that fetch data (e.g. Net earnings prev Month) are fetched correctly for each cell
- All mathematical operations are correctly performed and displayed in an intuitive way
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

const tableData: TableDataType[] = (sourceData as unknown as SourceDataType[])
  .map((dataRow, index) => {
    const isEmployee = !!dataRow.employees;
    const isExternal = !!dataRow.externals;

    if (isEmployee) {
      if (dataRow.employees?.statusAggregation?.status === "Inaktiv")
        return null;
    } else if (isExternal) {
      if (dataRow.externals?.status !== "active") return null;
    } else {
      return null;
    }

    const person = isEmployee ? dataRow.employees! : dataRow.externals!;
    const util = person.workforceUtilisation;

    // parseRate function to convert the rate to a percentage string
    // and format it to one decimal place
    // if the value is undefined, it returns "0%" which is the default value

    const parseRate = (value: string | undefined): string =>
      value ? `${(parseFloat(value) * 100).toFixed(1)}%` : "0%";

    const lastThreeMonths = util?.lastThreeMonthsIndividually ?? [];

    // the values are sent directly from the tableData to the parseRate function to convert them to a percentage string
    // and checks if the value is undefined, it returns "0%"
    const row: TableDataType = {
      person: `${person?.firstname} ${person?.lastname}`,
      past12Months: parseRate(util?.utilisationRateLastTwelveMonths),
      y2d: parseRate(util?.utilisationRateYearToDate),
      may: parseRate(
        lastThreeMonths.find((m) => m.month === "May")?.utilisationRate
      ),
      june: parseRate(
        lastThreeMonths.find((m) => m.month === "June")?.utilisationRate
      ),
      july: parseRate(
        lastThreeMonths.find((m) => m.month === "July")?.utilisationRate
      ),
      netEarningsPrevMonth: getNetEarningsPrevMonth(dataRow),
    };
    return row;
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
