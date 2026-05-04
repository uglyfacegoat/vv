import { useTheme } from "./ThemeProvider";
import { BudgetIQMark } from "./brand/BudgetIQMark";

export function Footer() {
  const { dark } = useTheme();
  const year = new Date().getFullYear();

  return (
    <footer
      className={`relative py-6 px-6 ${
        dark ? "bg-gray-950 text-gray-400" : "bg-[#f3f6fc] text-gray-600 border-t border-[#e5eaf6]"
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
          <div className="flex items-center gap-2.5 shrink-0">
            <BudgetIQMark size={26} />
            <span className={`${dark ? "text-white" : "text-gray-900"} text-[1rem]`} style={{ fontWeight: 700 }}>
              BudgetIQ
            </span>
          </div>
          <p className={`text-[0.85rem] md:text-center md:flex-1 md:px-4 ${dark ? "text-gray-500" : "text-gray-600"}`}>
            Учебный проект ВУЗа по план-факт анализу бюджета подразделений.
          </p>
          <span className={`text-[0.8rem] shrink-0 md:text-right ${dark ? "text-gray-600" : "text-gray-500"}`}>
            &copy; {year} BudgetIQ
          </span>
        </div>
      </div>
    </footer>
  );
}
