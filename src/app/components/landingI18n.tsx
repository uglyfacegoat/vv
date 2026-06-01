import { createContext, useContext } from "react";

export type LandingLanguage = "ru" | "en" | "zh" | "es";

export const landingLanguages: Array<{ code: LandingLanguage; label: string; shortLabel: string }> = [
  { code: "ru", label: "Русский", shortLabel: "RU" },
  { code: "en", label: "English", shortLabel: "EN" },
  { code: "zh", label: "中文", shortLabel: "中文" },
  { code: "es", label: "Español", shortLabel: "ES" },
];

export const landingCopy = {
  ru: {
    nav: {
      subtitle: "План-факт анализ бюджета",
      items: ["Как это работает", "Решение", "Дашборды", "Импорт"],
      login: "Войти",
      openProject: "Открыть проект",
      lightTheme: "Светлая тема",
      darkTheme: "Тёмная тема",
      openMenu: "Открыть меню",
      closeMenu: "Закрыть меню",
      language: "Язык",
    },
    heroIntro: {
      headline: ["Поймите", "свои", "ЦИФРЫ", "Контролируйте", "бюджет", "Видьте", "бизнес", "ясно", ""],
      openProject: "Открыть проект",
      howItWorks: "Как устроен проект",
      imageAlt: "Глянцевая абстрактная петля",
    },
    hero: {
      title: ["Контролируйте бюджет.", "Управляйте отклонениями.", "Видьте реальную картину."],
      subtitle: "Учебный интерфейс по план-факт анализу бюджета подразделений. На лендинге показаны импорт CSV, дашборд с KPI, отчёт и сценарии проверки данных.",
      cards: ["Бюджет", "Факт", "Отклонение", "KPI"],
      plan: "План",
      fact: "Факт",
    },
    how: {
      badge: "Как это работает",
      title: "От загрузки CSV до итогового отчёта",
      accent: "в одном сценарии",
      subtitle: "Секция повторяет реальную последовательность работы в проекте: вход, импорт, проверка дашборда и итоговый отчёт.",
      steps: [
        ["Вход в проект", "После входа открывается учебный контур с дашбордом, импортом, отчётом и документацией.", "Email и роль"],
        ["Импорт CSV", "Загрузите четыре файла: ЦФО, статьи затрат, plan и fact. Проект показывает ошибки формата и связей.", "4 CSV-файла"],
        ["Проверка дашборда", "Сверьте KPI, план-факт графики и статусы отклонений по подразделениям и периодам.", "KPI и фильтры"],
        ["Итоговый отчёт", "Соберите сводный результат, проверьте напоминания и при необходимости выгрузите CSV.", "Отчёт и экспорт"],
      ],
    },
    problem: {
      badge: "Что показывает проект",
      title: "Где бюджетный процесс",
      accent: "ломается чаще всего",
      subtitle: "В учебном сценарии разобраны типичные проблемы: разрозненные таблицы, ручные сверки и отсутствие единой картины по плану и факту.",
      items: [
        ["Таблицы в Excel", "Десятки файлов, версий, ручных правок. Данные теряются, формулы ломаются."],
        ["Хаос в бюджетах", "Каждое подразделение ведёт учёт по-своему. Консолидация занимает дни."],
        ["Нет единой картины", "Руководство не видит реальных отклонений. Решения принимаются вслепую."],
        ["Потеря контроля", "Отклонения обнаруживаются постфактум. Нет системы раннего предупреждения."],
      ],
    },
    solution: {
      badge: "Решение",
      title: "Что уже есть",
      accent: "в проекте",
      subtitle: "Лендинг показывает реальные разделы учебного проекта: импорт данных, расчёты отклонений, дашборды, отчёты и справочную документацию.",
      features: [
        ["План-факт расчёты", "Проект считает delta, delta_% и сводные KPI по учебным данным."],
        ["Импорт 4 CSV-файлов", "Загрузка справочников ЦФО и статей затрат, а также plan и fact."],
        ["KPI и дашборды", "На экранах есть карточки метрик, графики и сводный обзор по подразделениям."],
        ["Статусы отклонений", "Поддерживаются статусы IN_NORM, OVERSPEND, SAVING и NO_PLAN."],
        ["Проверка данных", "Интерфейс показывает ошибки формата, дубли, пропуски и несоответствия справочникам."],
        ["Документация и сценарии", "В проекте есть страницы с формулами расчёта, процессом использования и демо-сценариями."],
      ],
    },
    dashboard: {
      badge: "Аналитика",
      title: "Дашборды, которые",
      accent: "говорят сами",
      subtitle: "В дашборде собраны сводные метрики, план-факт по месяцам и структура расходов по учебным данным проекта.",
      metrics: ["Общий бюджет", "Исполнение", "Отклонения", "Экономия"],
      chartTitle: "План-факт по месяцам",
      chartRange: "Янв — Дек 2025",
      plan: "План",
      fact: "Факт",
      months: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
      expenseStructure: "Структура расходов",
      categories: ["ФОТ", "ИТ", "Маркетинг", "Прочее"],
      executionKpi: "KPI исполнения",
      quarterChange: "+4.2% к прошлому кварталу",
    },
    import: {
      badge: "Импорт и проверка",
      title: "Как проект работает",
      accent: "с данными",
      subtitle: "Здесь показан реальный контур импорта: загрузка CSV, валидация, проверка полноты и отображение статусов в интерфейсе.",
      steps: [
        ["Загрузка CSV", "Проект принимает четыре файла: cost_centers, items, plan и fact.", ["4 CSV", "plan/fact", "справочники"]],
        ["Валидация", "Автоматическая проверка структуры, форматов, дубликатов и аномалий.", ["Проверка", "Очистка", "Маппинг"]],
        ["Проверка полноты", "После загрузки можно сверить периоды, связи между справочниками и пропуски plan/fact.", ["Периоды", "Связи", "Пропуски"]],
        ["Уведомления", "После импорта интерфейс показывает статусы файлов, напоминания и результаты проверок.", ["Статусы", "Напоминания", "Журнал"]],
      ] as Array<[string, string, string[]]>,
      statusTitle: "Статус загрузки",
      statusSubtitle: "Пример состояния файлов после обработки",
      demoMode: "Демо-режим",
      rows: [["Проверено", "128", "строк"], ["Проверено", "214", "строк"], ["Есть замечания", "824", "строк"]],
    },
    cta: {
      badge: "Начните за 5 минут",
      heading: ["Начните управлять", "бюджетом как", "продуктом", "без усилий", "без хаоса"],
      button: "Попробовать BudgetIQ",
      footer: "Учебный проект ВУЗа по план-факт анализу бюджета подразделений.",
      imageAlt: "Глянцевый хромированный тор",
    },
  },
  en: {
    nav: { subtitle: "Budget plan-vs-actual analysis", items: ["How it works", "Solution", "Dashboards", "Import"], login: "Log in", openProject: "Open project", lightTheme: "Light theme", darkTheme: "Dark theme", openMenu: "Open menu", closeMenu: "Close menu", language: "Language" },
    heroIntro: { headline: ["Understand", "your", "NUMBERS", "Control", "every movement", "See", "the business", "as it", "really is"], openProject: "Open project", howItWorks: "How the project works", imageAlt: "Glossy abstract loop" },
    hero: { title: ["Control the budget.", "Manage variances.", "See the real picture."], subtitle: "A learning interface for department budget plan-vs-actual analysis. The landing page shows CSV import, KPI dashboards, reports, and data-check scenarios.", cards: ["Budget", "Actual", "Variance", "KPI"], plan: "Plan", fact: "Actual" },
    how: { badge: "How it works", title: "From CSV upload to final report", accent: "in one workflow", subtitle: "This section mirrors the real project flow: sign in, import, dashboard review, and final report.", steps: [["Project access", "After sign-in, the training workspace opens with dashboards, import, reports, and documentation.", "Email and role"], ["CSV import", "Upload four files: cost centers, expense items, plan, and actuals. The project highlights format and relationship errors.", "4 CSV files"], ["Dashboard review", "Check KPIs, plan-vs-actual charts, and variance statuses by department and period.", "KPIs and filters"], ["Final report", "Build the summary, check reminders, and export CSV when needed.", "Report and export"]] },
    problem: { badge: "What the project shows", title: "Where the budget process", accent: "breaks most often", subtitle: "The training scenario covers common issues: scattered spreadsheets, manual reconciliation, and no single plan-vs-actual picture.", items: [["Excel spreadsheets", "Dozens of files, versions, and manual edits. Data gets lost and formulas break."], ["Budget chaos", "Each department tracks data differently. Consolidation takes days."], ["No single picture", "Leadership cannot see real variances. Decisions are made blindly."], ["Loss of control", "Variances are discovered after the fact. There is no early-warning system."]] },
    solution: { badge: "Solution", title: "What is already", accent: "in the project", subtitle: "The landing page presents real project areas: data import, variance calculations, dashboards, reports, and documentation.", features: [["Plan-vs-actual calculations", "The project calculates delta, delta_%, and summary KPIs using training data."], ["4 CSV file import", "Upload cost center and expense item references, plus plan and actual files."], ["KPIs and dashboards", "Screens include metric cards, charts, and a department overview."], ["Variance statuses", "Statuses include IN_NORM, OVERSPEND, SAVING, and NO_PLAN."], ["Data validation", "The interface surfaces format errors, duplicates, gaps, and reference mismatches."], ["Docs and scenarios", "The project includes formula docs, usage flows, and demo scenarios."]] },
    dashboard: { badge: "Analytics", title: "Dashboards that", accent: "speak clearly", subtitle: "The dashboard combines summary metrics, monthly plan-vs-actual views, and expense structure from project training data.", metrics: ["Total budget", "Execution", "Variances", "Savings"], chartTitle: "Monthly plan vs actual", chartRange: "Jan — Dec 2025", plan: "Plan", fact: "Actual", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], expenseStructure: "Expense structure", categories: ["Payroll", "IT", "Marketing", "Other"], executionKpi: "Execution KPI", quarterChange: "+4.2% vs previous quarter" },
    import: { badge: "Import and validation", title: "How the project works", accent: "with data", subtitle: "This shows the real import flow: CSV upload, validation, completeness checks, and status display in the interface.", steps: [["CSV upload", "The project accepts four files: cost_centers, items, plan, and fact.", ["4 CSV", "plan/fact", "references"]], ["Validation", "Automatic checks for structure, formats, duplicates, and anomalies.", ["Check", "Clean", "Map"]], ["Completeness check", "After upload, verify periods, reference links, and missing plan/fact records.", ["Periods", "Links", "Gaps"]], ["Notifications", "After import, the interface shows file statuses, reminders, and validation results.", ["Statuses", "Reminders", "Log"]]], statusTitle: "Upload status", statusSubtitle: "Example file state after processing", demoMode: "Demo mode", rows: [["Verified", "128", "rows"], ["Verified", "214", "rows"], ["Needs review", "824", "rows"]] },
    cta: { badge: "Start in 5 minutes", heading: ["Start managing", "the budget like", "a product", "without effort", "without chaos"], button: "Try BudgetIQ", footer: "University learning project for department budget plan-vs-actual analysis.", imageAlt: "Glossy chrome torus" },
  },
  zh: {
    nav: { subtitle: "预算计划与实际分析", items: ["工作方式", "解决方案", "仪表盘", "导入"], login: "登录", openProject: "打开项目", lightTheme: "浅色主题", darkTheme: "深色主题", openMenu: "打开菜单", closeMenu: "关闭菜单", language: "语言" },
    heroIntro: { headline: ["理解", "你的", "数字", "掌控", "每一次变化", "看清", "业务", "真实", "状态"], openProject: "打开项目", howItWorks: "项目如何运行", imageAlt: "光泽抽象环" },
    hero: { title: ["掌控预算。", "管理偏差。", "看见真实全局。"], subtitle: "用于部门预算计划与实际分析的教学界面。落地页展示 CSV 导入、KPI 仪表盘、报表和数据检查场景。", cards: ["预算", "实际", "偏差", "KPI"], plan: "计划", fact: "实际" },
    how: { badge: "工作方式", title: "从 CSV 上传到最终报表", accent: "一个完整流程", subtitle: "本节复现项目中的真实顺序：登录、导入、查看仪表盘并生成最终报表。", steps: [["进入项目", "登录后会打开包含仪表盘、导入、报表和文档的教学环境。", "邮箱和角色"], ["CSV 导入", "上传四个文件：成本中心、费用项目、plan 和 fact。项目会显示格式和关联错误。", "4 个 CSV 文件"], ["检查仪表盘", "按部门和期间核对 KPI、计划实际图表和偏差状态。", "KPI 和筛选"], ["最终报表", "汇总结果，检查提醒，并在需要时导出 CSV。", "报表和导出"]] },
    problem: { badge: "项目展示内容", title: "预算流程", accent: "最常失控的地方", subtitle: "教学场景覆盖典型问题：分散表格、手工核对，以及缺少计划与实际的统一视图。", items: [["Excel 表格", "大量文件、版本和手工修改。数据会丢失，公式会损坏。"], ["预算混乱", "每个部门用自己的方式记录数据，汇总需要数天。"], ["缺少统一视图", "管理层看不到真实偏差，只能盲目决策。"], ["失去控制", "偏差往往事后才被发现，缺少预警系统。"]] },
    solution: { badge: "解决方案", title: "项目中", accent: "已有的能力", subtitle: "落地页展示教学项目的真实模块：数据导入、偏差计算、仪表盘、报表和参考文档。", features: [["计划实际计算", "项目基于教学数据计算 delta、delta_% 和汇总 KPI。"], ["导入 4 个 CSV 文件", "导入成本中心、费用项目，以及 plan 和 fact 文件。"], ["KPI 和仪表盘", "界面包含指标卡、图表和部门汇总视图。"], ["偏差状态", "支持 IN_NORM、OVERSPEND、SAVING 和 NO_PLAN 状态。"], ["数据校验", "界面显示格式错误、重复、缺失和引用不匹配。"], ["文档和场景", "项目包含计算公式、使用流程和演示场景页面。"]] },
    dashboard: { badge: "分析", title: "会说话的", accent: "仪表盘", subtitle: "仪表盘汇总关键指标、按月计划实际对比以及教学数据中的费用结构。", metrics: ["总预算", "执行率", "偏差", "节省"], chartTitle: "按月计划实际", chartRange: "2025年1月—12月", plan: "计划", fact: "实际", months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"], expenseStructure: "费用结构", categories: ["薪酬", "IT", "营销", "其他"], executionKpi: "执行 KPI", quarterChange: "较上季度 +4.2%" },
    import: { badge: "导入与校验", title: "项目如何处理", accent: "数据", subtitle: "这里展示真实导入流程：上传 CSV、校验、完整性检查，并在界面中显示状态。", steps: [["上传 CSV", "项目接收四个文件：cost_centers、items、plan 和 fact。", ["4 CSV", "plan/fact", "参考表"]], ["校验", "自动检查结构、格式、重复和异常。", ["检查", "清理", "映射"]], ["完整性检查", "上传后可核对期间、参考表关联以及 plan/fact 缺失。", ["期间", "关联", "缺失"]], ["通知", "导入后界面显示文件状态、提醒和检查结果。", ["状态", "提醒", "日志"]]], statusTitle: "上传状态", statusSubtitle: "文件处理后的示例状态", demoMode: "演示模式", rows: [["已校验", "128", "行"], ["已校验", "214", "行"], ["有提示", "824", "行"]] },
    cta: { badge: "5 分钟开始", heading: ["开始像管理", "产品一样", "管理预算", "不费力", "不混乱"], button: "试用 BudgetIQ", footer: "大学部门预算计划与实际分析教学项目。", imageAlt: "光泽铬色圆环" },
  },
  es: {
    nav: { subtitle: "Análisis presupuesto plan vs real", items: ["Cómo funciona", "Solución", "Dashboards", "Importación"], login: "Entrar", openProject: "Abrir proyecto", lightTheme: "Tema claro", darkTheme: "Tema oscuro", openMenu: "Abrir menú", closeMenu: "Cerrar menú", language: "Idioma" },
    heroIntro: { headline: ["Entiende", "tus", "NÚMEROS", "Controla", "cada movimiento", "Ve", "el negocio", "tal como", "es"], openProject: "Abrir proyecto", howItWorks: "Cómo funciona el proyecto", imageAlt: "Bucle abstracto brillante" },
    hero: { title: ["Controla el presupuesto.", "Gestiona desviaciones.", "Ve la imagen real."], subtitle: "Interfaz educativa para análisis plan-real del presupuesto por departamentos. La landing muestra importación CSV, dashboards con KPI, reportes y escenarios de validación.", cards: ["Presupuesto", "Real", "Desviación", "KPI"], plan: "Plan", fact: "Real" },
    how: { badge: "Cómo funciona", title: "De la carga CSV al reporte final", accent: "en un solo flujo", subtitle: "La sección repite la secuencia real del proyecto: acceso, importación, revisión del dashboard y reporte final.", steps: [["Acceso al proyecto", "Tras entrar se abre el entorno educativo con dashboard, importación, reportes y documentación.", "Email y rol"], ["Importación CSV", "Carga cuatro archivos: centros de costo, partidas, plan y real. El proyecto muestra errores de formato y relaciones.", "4 archivos CSV"], ["Revisión del dashboard", "Comprueba KPI, gráficos plan-real y estados de desviación por departamento y período.", "KPI y filtros"], ["Reporte final", "Genera el resumen, revisa recordatorios y exporta CSV si hace falta.", "Reporte y exportación"]] },
    problem: { badge: "Qué muestra el proyecto", title: "Dónde el proceso presupuestario", accent: "falla más a menudo", subtitle: "El escenario educativo cubre problemas típicos: hojas dispersas, conciliaciones manuales y falta de una vista única plan-real.", items: [["Hojas de Excel", "Decenas de archivos, versiones y cambios manuales. Los datos se pierden y las fórmulas fallan."], ["Caos presupuestario", "Cada departamento registra datos a su manera. Consolidar toma días."], ["Sin visión única", "La dirección no ve desviaciones reales. Las decisiones se toman a ciegas."], ["Pérdida de control", "Las desviaciones se detectan tarde. No hay sistema de alerta temprana."]] },
    solution: { badge: "Solución", title: "Qué ya existe", accent: "en el proyecto", subtitle: "La landing muestra secciones reales del proyecto educativo: importación, cálculos de desviación, dashboards, reportes y documentación.", features: [["Cálculos plan-real", "El proyecto calcula delta, delta_% y KPI agregados con datos educativos."], ["Importación de 4 CSV", "Carga referencias de centros de costo y partidas, además de plan y real."], ["KPI y dashboards", "Las pantallas incluyen tarjetas de métricas, gráficos y resumen por departamentos."], ["Estados de desviación", "Se admiten IN_NORM, OVERSPEND, SAVING y NO_PLAN."], ["Validación de datos", "La interfaz muestra errores de formato, duplicados, faltantes e inconsistencias."], ["Documentación y escenarios", "El proyecto incluye fórmulas, flujo de uso y escenarios demo."]] },
    dashboard: { badge: "Analítica", title: "Dashboards que", accent: "hablan solos", subtitle: "El dashboard reúne métricas, plan-real mensual y estructura de gastos con datos educativos del proyecto.", metrics: ["Presupuesto total", "Ejecución", "Desviaciones", "Ahorro"], chartTitle: "Plan-real mensual", chartRange: "Ene — Dic 2025", plan: "Plan", fact: "Real", months: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"], expenseStructure: "Estructura de gastos", categories: ["Nómina", "IT", "Marketing", "Otros"], executionKpi: "KPI de ejecución", quarterChange: "+4.2% vs trimestre anterior" },
    import: { badge: "Importación y validación", title: "Cómo trabaja el proyecto", accent: "con datos", subtitle: "Aquí se muestra el flujo real de importación: carga CSV, validación, verificación de completitud y estados en la interfaz.", steps: [["Carga CSV", "El proyecto acepta cuatro archivos: cost_centers, items, plan y fact.", ["4 CSV", "plan/fact", "referencias"]], ["Validación", "Comprobación automática de estructura, formatos, duplicados y anomalías.", ["Validar", "Limpiar", "Mapear"]], ["Completitud", "Tras la carga se revisan períodos, relaciones y faltantes plan/fact.", ["Períodos", "Relaciones", "Faltantes"]], ["Notificaciones", "Tras importar, la interfaz muestra estados, recordatorios y resultados.", ["Estados", "Recordatorios", "Registro"]]], statusTitle: "Estado de carga", statusSubtitle: "Ejemplo del estado de archivos tras procesarlos", demoMode: "Modo demo", rows: [["Validado", "128", "filas"], ["Validado", "214", "filas"], ["Con avisos", "824", "filas"]] },
    cta: { badge: "Empieza en 5 minutos", heading: ["Empieza a gestionar", "el presupuesto como", "un producto", "sin esfuerzo", "sin caos"], button: "Probar BudgetIQ", footer: "Proyecto universitario educativo para análisis presupuesto plan vs real por departamentos.", imageAlt: "Toro cromado brillante" },
  },
} as const;

interface LandingI18nContextValue {
  language: LandingLanguage;
  setLanguage: (language: LandingLanguage) => void;
  copy: typeof landingCopy.ru;
}

export const LandingI18nContext = createContext<LandingI18nContextValue | null>(null);

export function useLandingI18n() {
  const value = useContext(LandingI18nContext);
  if (!value) {
    throw new Error("useLandingI18n must be used inside LandingI18nContext.Provider");
  }
  return value;
}
