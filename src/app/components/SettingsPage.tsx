import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Sliders,
  Shield,
  Database,
  Bell,
  Globe,
  Palette,
  Trash2,
  RotateCcw,
  Save,
  ChevronRight,
  Users,
  AlertTriangle,
  CheckCircle2,
  Info,
  Plus,
  Pencil,
  X,
  Check,
} from "lucide-react";
import {
  createCostCenter,
  createItem,
  clearPlanFactData,
  deleteDataEntry,
  deleteCostCenter,
  deleteItem,
  getDataEntries,
  getImportLogs,
  getCostCenters,
  getItems,
  saveThresholdSetting,
  updateAccountSettings,
  updateCostCenter,
  updateItem,
  upsertDataEntry,
  type DataEntry,
  type DataKind,
  type ImportLogEntry,
  type UserSettings,
} from "../api";
import type { UserRole } from "../auth";

interface SettingSection {
  id: string;
  icon: typeof Sliders;
  title: string;
  description: string;
  color: string;
}

const sections: SettingSection[] = [
  { id: "thresholds", icon: Sliders, title: "Пороги отклонений", description: "Границы статусов план-факт", color: "#6366f1" },
  { id: "notifications", icon: Bell, title: "Уведомления", description: "Управление алертами и оповещениями", color: "#06b6d4" },
  { id: "roles", icon: Shield, title: "Роли и доступ", description: "Контролёр, менеджер, аналитик", color: "#8b5cf6" },
  { id: "references", icon: Database, title: "Справочники", description: "Cost centers и items (CRUD)", color: "#f59e0b" },
  { id: "display", icon: Palette, title: "Отображение", description: "Формат чисел, язык, визуальные настройки", color: "#10b981" },
  { id: "data", icon: Trash2, title: "Управление данными", description: "Очистка, реимпорт, логи", color: "#ef4444" },
];

const rolesList = [
  { role: "controller", label: "Контролёр", description: "Полный доступ: данные, импорт, настройки, правила", users: 2, color: "#ef4444" },
  { role: "manager", label: "Менеджер", description: "Доступ только к своим ЦФО: просмотр и экспорт отчётов", users: 5, color: "#6366f1" },
  { role: "analyst", label: "Аналитик", description: "Полный доступ к данным/отчётам + импорт CSV", users: 12, color: "#06b6d4" },
];

interface CostCenterItem {
  id: string;
  code: string;
  name: string;
  owner: string;
  active: boolean;
}

interface ExpenseItem {
  id: string;
  code: string;
  name: string;
  type: "OPEX" | "CAPEX";
  active: boolean;
}

const initialCostCenters: CostCenterItem[] = [
  { id: "cc-1", code: "CC-100", name: "Производство", owner: "Операционный блок", active: true },
  { id: "cc-2", code: "CC-200", name: "Коммерция", owner: "Департамент продаж", active: true },
  { id: "cc-3", code: "CC-300", name: "ИТ", owner: "Технологический блок", active: true },
];

const initialExpenseItems: ExpenseItem[] = [
  { id: "item-1", code: "ITM-001", name: "ФОТ", type: "OPEX", active: true },
  { id: "item-2", code: "ITM-014", name: "Маркетинг", type: "OPEX", active: true },
  { id: "item-3", code: "ITM-221", name: "Оборудование", type: "CAPEX", active: true },
];

const MAIN_THRESHOLD_MIN = 1;
const MAIN_THRESHOLD_MAX = 30;
const MAIN_THRESHOLD_DEFAULT = 10;

function thresholdPosition(value: number) {
  const clamped = Math.min(MAIN_THRESHOLD_MAX, Math.max(MAIN_THRESHOLD_MIN, value));
  return ((clamped - MAIN_THRESHOLD_MIN) / (MAIN_THRESHOLD_MAX - MAIN_THRESHOLD_MIN)) * 100;
}

interface SettingsPageProps {
  threshold: number;
  onThresholdChange: (value: number) => void;
  accountSettings: UserSettings;
  onAccountSettingsChange: (settings: UserSettings) => void;
  userRole: UserRole;
  onOpenAdmin: () => void;
}

export function SettingsPage({
  threshold,
  onThresholdChange,
  accountSettings,
  onAccountSettingsChange,
  userRole,
  onOpenAdmin,
}: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState("thresholds");
  const [overspendThreshold, setOverspendThreshold] = useState(accountSettings.overspend_threshold);
  const [savingThreshold, setSavingThreshold] = useState(accountSettings.saving_threshold);
  const [numberFormat, setNumberFormat] = useState<"ru" | "en">(accountSettings.number_format);
  const [currency, setCurrency] = useState(accountSettings.currency);
  const [notifyImport, setNotifyImport] = useState(accountSettings.notify_import);
  const [notifyOverspend, setNotifyOverspend] = useState(accountSettings.notify_overspend);
  const [notifyWeekly, setNotifyWeekly] = useState(accountSettings.notify_weekly);
  const [emailNotify, setEmailNotify] = useState(accountSettings.email_notify);
  const [saving, setSaving] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [costCenters, setCostCenters] = useState<CostCenterItem[]>(initialCostCenters);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>(initialExpenseItems);
  const [newCostCenter, setNewCostCenter] = useState({ code: "", name: "", owner: "" });
  const [newExpenseItem, setNewExpenseItem] = useState({ code: "", name: "", type: "OPEX" as "OPEX" | "CAPEX" });
  const [editingCostCenterId, setEditingCostCenterId] = useState<string | null>(null);
  const [editingExpenseItemId, setEditingExpenseItemId] = useState<string | null>(null);
  const [costCenterDraft, setCostCenterDraft] = useState({ code: "", name: "", owner: "", active: true });
  const [expenseItemDraft, setExpenseItemDraft] = useState({ code: "", name: "", type: "OPEX" as "OPEX" | "CAPEX", active: true });
  const [refsLoading, setRefsLoading] = useState(false);
  const [dataKind, setDataKind] = useState<DataKind>("plan");
  const [dataEntries, setDataEntries] = useState<DataEntry[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataSearch, setDataSearch] = useState("");
  const [dataDraft, setDataDraft] = useState({ period: "", cc_id: "", item_id: "", amount: "" });
  const [importLogs, setImportLogs] = useState<ImportLogEntry[]>([]);
  const thresholdPercent = thresholdPosition(threshold);
  const defaultThresholdPercent = thresholdPosition(MAIN_THRESHOLD_DEFAULT);

  const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  useEffect(() => {
    setOverspendThreshold(accountSettings.overspend_threshold);
    setSavingThreshold(accountSettings.saving_threshold);
    setNumberFormat(accountSettings.number_format);
    setCurrency(accountSettings.currency);
    setNotifyImport(accountSettings.notify_import);
    setNotifyOverspend(accountSettings.notify_overspend);
    setNotifyWeekly(accountSettings.notify_weekly);
    setEmailNotify(accountSettings.email_notify);
  }, [accountSettings]);

  useEffect(() => {
    let ignore = false;
    setRefsLoading(true);
    Promise.all([getCostCenters(), getItems()])
      .then(([ccs, items]) => {
        if (ignore) return;
        setCostCenters(ccs.map((cc) => ({
          id: String(cc.cc_id),
          code: cc.code,
          name: cc.name,
          owner: cc.owner,
          active: cc.active,
        })));
        setExpenseItems(items.map((item) => ({
          id: String(item.item_id),
          code: item.code,
          name: item.name,
          type: item.type,
          active: item.active,
        })));
      })
      .catch((error) => {
        toast.error("Не удалось загрузить справочники", {
          description: error instanceof Error ? error.message : "Проверьте backend",
        });
      })
      .finally(() => {
        if (!ignore) setRefsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const loadDataEntries = async (kind = dataKind) => {
    setDataLoading(true);
    try {
      const [entries, logs] = await Promise.all([getDataEntries(kind, 300), getImportLogs(20)]);
      setDataEntries(entries);
      setImportLogs(logs);
    } catch (error) {
      toast.error("Не удалось загрузить строки или лог импортов", {
        description: error instanceof Error ? error.message : "Ошибка backend",
      });
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === "data") {
      loadDataEntries(dataKind);
    }
  }, [activeSection, dataKind]);

  const handleAddCostCenter = async () => {
    const code = newCostCenter.code.trim().toUpperCase();
    const name = newCostCenter.name.trim();
    const owner = newCostCenter.owner.trim();
    if (!code || !name || !owner) {
      toast.error("Заполните все поля ЦФО");
      return;
    }
    if (costCenters.some((cc) => cc.code.toLowerCase() === code.toLowerCase())) {
      toast.error("ЦФО с таким кодом уже существует");
      return;
    }
    try {
      const created = await createCostCenter({ code, name, owner, active: true });
      setCostCenters((prev) => [...prev, {
        id: String(created.cc_id),
        code: created.code,
        name: created.name,
        owner: created.owner,
        active: created.active,
      }]);
      setNewCostCenter({ code: "", name: "", owner: "" });
      toast.success("ЦФО добавлен");
    } catch (error) {
      toast.error("Не удалось добавить ЦФО", { description: error instanceof Error ? error.message : "Ошибка backend" });
    }
  };

  const handleAddExpenseItem = async () => {
    const code = newExpenseItem.code.trim().toUpperCase();
    const name = newExpenseItem.name.trim();
    if (!code || !name) {
      toast.error("Заполните код и наименование статьи");
      return;
    }
    if (expenseItems.some((item) => item.code.toLowerCase() === code.toLowerCase())) {
      toast.error("Статья с таким кодом уже существует");
      return;
    }
    try {
      const created = await createItem({ code, name, type: newExpenseItem.type, active: true });
      setExpenseItems((prev) => [...prev, {
        id: String(created.item_id),
        code: created.code,
        name: created.name,
        type: created.type,
        active: created.active,
      }]);
      setNewExpenseItem({ code: "", name: "", type: "OPEX" });
      toast.success("Статья добавлена");
    } catch (error) {
      toast.error("Не удалось добавить статью", { description: error instanceof Error ? error.message : "Ошибка backend" });
    }
  };

  const startEditCostCenter = (cc: CostCenterItem) => {
    setEditingCostCenterId(cc.id);
    setCostCenterDraft({ code: cc.code, name: cc.name, owner: cc.owner, active: cc.active });
  };

  const saveCostCenterEdit = async () => {
    if (!editingCostCenterId) return;
    const code = costCenterDraft.code.trim().toUpperCase();
    const name = costCenterDraft.name.trim();
    const owner = costCenterDraft.owner.trim();
    if (!code || !name || !owner) {
      toast.error("Заполните все поля ЦФО");
      return;
    }
    if (costCenters.some((cc) => cc.id !== editingCostCenterId && cc.code.toLowerCase() === code.toLowerCase())) {
      toast.error("ЦФО с таким кодом уже существует");
      return;
    }
    try {
      const updated = await updateCostCenter(Number(editingCostCenterId), { code, name, owner, active: costCenterDraft.active });
      setCostCenters((prev) =>
        prev.map((cc) =>
          cc.id === editingCostCenterId
            ? { id: String(updated.cc_id), code: updated.code, name: updated.name, owner: updated.owner, active: updated.active }
            : cc,
        ),
      );
      setEditingCostCenterId(null);
      toast.success("ЦФО обновлен");
    } catch (error) {
      toast.error("Не удалось обновить ЦФО", { description: error instanceof Error ? error.message : "Ошибка backend" });
    }
  };

  const startEditExpenseItem = (item: ExpenseItem) => {
    setEditingExpenseItemId(item.id);
    setExpenseItemDraft({ code: item.code, name: item.name, type: item.type, active: item.active });
  };

  const saveExpenseItemEdit = async () => {
    if (!editingExpenseItemId) return;
    const code = expenseItemDraft.code.trim().toUpperCase();
    const name = expenseItemDraft.name.trim();
    if (!code || !name) {
      toast.error("Заполните код и наименование статьи");
      return;
    }
    if (expenseItems.some((item) => item.id !== editingExpenseItemId && item.code.toLowerCase() === code.toLowerCase())) {
      toast.error("Статья с таким кодом уже существует");
      return;
    }
    try {
      const updated = await updateItem(Number(editingExpenseItemId), { code, name, type: expenseItemDraft.type, active: expenseItemDraft.active });
      setExpenseItems((prev) =>
        prev.map((item) =>
          item.id === editingExpenseItemId
            ? { id: String(updated.item_id), code: updated.code, name: updated.name, type: updated.type, active: updated.active }
            : item,
        ),
      );
      setEditingExpenseItemId(null);
      toast.success("Статья обновлена");
    } catch (error) {
      toast.error("Не удалось обновить статью", { description: error instanceof Error ? error.message : "Ошибка backend" });
    }
  };

  const toggleCostCenterActive = async (cc: CostCenterItem) => {
    try {
      const updated = await updateCostCenter(Number(cc.id), {
        code: cc.code,
        name: cc.name,
        owner: cc.owner,
        active: !cc.active,
      });
      setCostCenters((prev) =>
        prev.map((row) => (row.id === cc.id ? { ...row, active: updated.active } : row)),
      );
    } catch (error) {
      toast.error("Не удалось изменить статус ЦФО", { description: error instanceof Error ? error.message : "Ошибка backend" });
    }
  };

  const removeCostCenter = async (cc: CostCenterItem) => {
    try {
      await deleteCostCenter(Number(cc.id));
      setCostCenters((prev) => prev.filter((row) => row.id !== cc.id));
      if (editingCostCenterId === cc.id) setEditingCostCenterId(null);
      toast.success("ЦФО удален");
    } catch (error) {
      toast.error("Не удалось удалить ЦФО", { description: error instanceof Error ? error.message : "Ошибка backend" });
    }
  };

  const toggleExpenseItemActive = async (item: ExpenseItem) => {
    try {
      const updated = await updateItem(Number(item.id), {
        code: item.code,
        name: item.name,
        type: item.type,
        active: !item.active,
      });
      setExpenseItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, active: updated.active } : row)),
      );
    } catch (error) {
      toast.error("Не удалось изменить статус статьи", { description: error instanceof Error ? error.message : "Ошибка backend" });
    }
  };

  const removeExpenseItem = async (item: ExpenseItem) => {
    try {
      await deleteItem(Number(item.id));
      setExpenseItems((prev) => prev.filter((row) => row.id !== item.id));
      if (editingExpenseItemId === item.id) setEditingExpenseItemId(null);
      toast.success("Статья удалена");
    } catch (error) {
      toast.error("Не удалось удалить статью", { description: error instanceof Error ? error.message : "Ошибка backend" });
    }
  };

  const collectSettings = (): UserSettings => ({
    ...accountSettings,
    threshold,
    overspend_threshold: Math.min(100, Math.max(1, overspendThreshold || 1)),
    saving_threshold: Math.min(100, Math.max(1, savingThreshold || 1)),
    number_format: numberFormat,
    currency,
    notify_import: notifyImport,
    notify_overspend: notifyOverspend,
    notify_weekly: notifyWeekly,
    email_notify: emailNotify,
  });

  const handleSave = async () => {
    const settings = collectSettings();
    setSaving(true);
    try {
      const [account] = await Promise.all([
        updateAccountSettings(settings),
        saveThresholdSetting(settings.threshold),
      ]);
      onAccountSettingsChange(account.user.settings ?? settings);
      toast.success("Настройки сохранены", {
        description: `Порог: +-${settings.threshold}%, формат: ${numberFormat === "ru" ? "1 234,56" : "1,234.56"}`,
      });
    } catch (error) {
      toast.error("Не удалось сохранить настройки", {
        description: error instanceof Error ? error.message : "Проверьте соединение с backend",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDataEntry = async () => {
    const period = dataDraft.period.trim();
    const ccID = Number(dataDraft.cc_id);
    const itemID = Number(dataDraft.item_id);
    const amount = Number(dataDraft.amount);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period) || !ccID || !itemID || Number.isNaN(amount) || amount < 0) {
      toast.error("Проверьте поля строки", {
        description: "Период: YYYY-MM, cc_id/item_id: числа, сумма: >= 0",
      });
      return;
    }
    try {
      await upsertDataEntry(dataKind, { period, cc_id: ccID, item_id: itemID, amount });
      setDataDraft({ period: "", cc_id: "", item_id: "", amount: "" });
      await loadDataEntries(dataKind);
      toast.success(`${dataKind}: строка сохранена`);
    } catch (error) {
      toast.error("Не удалось сохранить строку", {
        description: error instanceof Error ? error.message : "Ошибка backend",
      });
    }
  };

  const handleDeleteDataEntry = async (entry: DataEntry) => {
    try {
      await deleteDataEntry(entry.kind, { period: entry.period, cc_id: entry.cc_id, item_id: entry.item_id });
      setDataEntries((prev) => prev.filter((item) => !(item.kind === entry.kind && item.period === entry.period && item.cc_id === entry.cc_id && item.item_id === entry.item_id)));
      toast.success(`${entry.kind}: строка удалена`);
    } catch (error) {
      toast.error("Не удалось удалить строку", {
        description: error instanceof Error ? error.message : "Ошибка backend",
      });
    }
  };

  const handleClearData = async () => {
    try {
      await clearPlanFactData();
      setShowConfirmClear(false);
      setDataEntries([]);
      toast.success("Данные очищены", {
        description: "Удалены записи plan и fact текущей компании. Справочники сохранены.",
      });
    } catch (error) {
      toast.error("Не удалось очистить данные", {
        description: error instanceof Error ? error.message : "Ошибка backend",
      });
    }
  };

  const handleResetDefaults = () => {
    onThresholdChange(10);
    setOverspendThreshold(15);
    setSavingThreshold(15);
    setNumberFormat("ru");
    setCurrency("RUB");
    setNotifyImport(true);
    setNotifyOverspend(true);
    setNotifyWeekly(false);
    setEmailNotify(true);
    toast.info("Настройки сброшены", { description: "Нажмите сохранить, чтобы записать значения в аккаунт" });
  };

  const filteredDataEntries = dataEntries.filter((entry) => {
    const q = dataSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      entry.period.includes(q)
      || entry.cc_name.toLowerCase().includes(q)
      || entry.item_name.toLowerCase().includes(q)
      || String(entry.cc_id).includes(q)
      || String(entry.item_id).includes(q)
    );
  });

  const formatImportDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value.slice(0, 16);
    return new Intl.DateTimeFormat("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-foreground tracking-[-0.02em]"
            style={{ fontSize: "24px", fontWeight: 600 }}
          >
            Настройки
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-1 text-[14px]"
          >
            Конфигурация системы план-факт анализа
          </motion.p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleResetDefaults}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-[13px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
            style={{ fontWeight: 500 }}
          >
            <RotateCcw className="w-4 h-4" />
            Сбросить
          </motion.button>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563eb] text-white text-[13px] hover:bg-[#1d4ed8] hover:shadow-lg hover:shadow-blue-500/20 transition-all"
            style={{ fontWeight: 500 }}
          >
            <Save className="w-4 h-4" />
            {saving ? "Сохраняем..." : "Сохранить"}
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Section nav */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-1"
        >
          {sections.map((s, i) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                activeSection === s.id
                  ? "bg-[#eef2ff] border border-[#bfdbfe] dark:bg-[#1e293b] dark:border-[#334155]"
                  : "hover:bg-muted border border-transparent"
              }`}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${s.color}15` }}
              >
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-foreground truncate" style={{ fontWeight: activeSection === s.id ? 500 : 400 }}>
                  {s.title}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{s.description}</p>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 transition-colors ${activeSection === s.id ? "text-primary" : "text-muted-foreground/30"}`} />
            </motion.button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl bg-card border border-border p-6 space-y-6"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
        >
          {/* Thresholds */}
          {activeSection === "thresholds" && (
            <>
              <div>
                <h3 className="text-foreground text-[16px] mb-1" style={{ fontWeight: 600 }}>Пороги отклонений</h3>
                <p className="text-[13px] text-muted-foreground">
                  Определяют границы статусов при план-факт анализе
                </p>
              </div>

              {/* Main threshold */}
              <div className="space-y-4">
                <div className="rounded-xl bg-muted/30 border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>Основной порог</p>
                      <p className="text-[11px] text-muted-foreground">Отклонение в пределах порога считается нормой</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[20px] text-primary tabular-nums" style={{ fontWeight: 600 }}>
                        +-{threshold}%
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={MAIN_THRESHOLD_MIN}
                    max={MAIN_THRESHOLD_MAX}
                    value={threshold}
                    onChange={(e) => onThresholdChange(Math.min(MAIN_THRESHOLD_MAX, Math.max(MAIN_THRESHOLD_MIN, Number(e.target.value) || MAIN_THRESHOLD_MIN)))}
                    className="threshold-range"
                  />
                  <div className="relative h-8 text-[10px] text-muted-foreground mt-1">
                    <span className="absolute left-0 top-0">{MAIN_THRESHOLD_MIN}%</span>
                    <span
                      className="absolute top-0 -translate-x-1/2 text-primary tabular-nums"
                      style={{ left: `${thresholdPercent}%`, fontWeight: 600 }}
                    >
                      {threshold}%
                    </span>
                    <span className="absolute right-0 top-0">{MAIN_THRESHOLD_MAX}%</span>
                    <span
                      className="absolute top-4 -translate-x-1/2"
                      style={{ left: `${defaultThresholdPercent}%` }}
                    >
                      {MAIN_THRESHOLD_DEFAULT}% default
                    </span>
                  </div>
                </div>

                {/* Alert thresholds */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-[#ef4444]/5 border border-[#ef4444]/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
                      <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>Критичный перерасход</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-3">Алерт при отклонении свыше {overspendThreshold}% в любом ЦФО</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={overspendThreshold}
                        onChange={(e) => setOverspendThreshold(Number(e.target.value))}
                        className="w-20 px-3 py-1.5 rounded-lg bg-card border border-border text-[13px] text-center"
                      />
                      <span className="text-[12px] text-muted-foreground">%</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#6366f1]/5 border border-[#6366f1]/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-[#6366f1]" />
                      <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>Значительная экономия</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-3">Отметка при экономии свыше этого значения</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={savingThreshold}
                        onChange={(e) => setSavingThreshold(Number(e.target.value))}
                        className="w-20 px-3 py-1.5 rounded-lg bg-card border border-border text-[13px] text-center"
                      />
                      <span className="text-[12px] text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="rounded-xl bg-muted/30 border border-border p-4">
                  <p className="text-[12px] text-muted-foreground mb-3" style={{ fontWeight: 500 }}>Предпросмотр статусов</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "В норме", desc: `отклонение до ${threshold}%`, color: "#10b981" },
                      { label: "Перерасход", desc: `свыше +${threshold}%`, color: "#ef4444" },
                      { label: "Экономия", desc: `свыше -${threshold}%`, color: "#6366f1" },
                      { label: "Нет плана", desc: "план не задан", color: "#94a3b8" },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg"
                        style={{ backgroundColor: `${s.color}10` }}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-[12px]" style={{ color: s.color, fontWeight: 500 }}>{s.label}</span>
                        <span className="text-[11px] text-muted-foreground">{s.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Notifications */}
          {activeSection === "notifications" && (
            <>
              <div>
                <h3 className="text-foreground text-[16px] mb-1" style={{ fontWeight: 600 }}>Уведомления</h3>
                <p className="text-[13px] text-muted-foreground">
                  Настройте какие события отправляют уведомления
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { key: "import", label: "Результаты импорта", desc: "Уведомлять о завершении загрузки CSV и ошибках валидации", checked: notifyImport, onChange: setNotifyImport, icon: Database, color: "#06b6d4" },
                  { key: "overspend", label: "Критичные перерасходы", desc: `Алерт при отклонении свыше ${overspendThreshold}% в любом ЦФО`, checked: notifyOverspend, onChange: setNotifyOverspend, icon: AlertTriangle, color: "#ef4444" },
                  { key: "weekly", label: "Еженедельный дайджест", desc: "Сводка KPI и топ-10 отклонений каждый понедельник", checked: notifyWeekly, onChange: setNotifyWeekly, icon: Bell, color: "#8b5cf6" },
                  { key: "email", label: "Email-уведомления", desc: "Дублировать важные уведомления на почту", checked: emailNotify, onChange: setEmailNotify, icon: Globe, color: "#f59e0b" },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center gap-4 rounded-xl bg-muted/30 border border-border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${item.color}15` }}
                    >
                      <item.icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => {
                        item.onChange(!item.checked);
                        toast(item.checked ? `${item.label} выключены` : `${item.label} включены`, {
                          description: item.checked ? "Уведомления отключены" : "Вы будете получать оповещения",
                        });
                      }}
                      className={`relative w-11 h-6 rounded-full transition-all duration-300 shrink-0 ${
                        item.checked ? "bg-[#6366f1]" : "bg-muted-foreground/20"
                      }`}
                    >
                      <motion.div
                        animate={{ x: item.checked ? 20 : 2 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                      />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Roles */}
          {activeSection === "roles" && (
            <>
              <div>
                <h3 className="text-foreground text-[16px] mb-1" style={{ fontWeight: 600 }}>Роли и доступ</h3>
                <p className="text-[13px] text-muted-foreground">
                  Три уровня доступа к системе
                </p>
              </div>

              <div className="space-y-3">
                {userRole === "controller" && (
                  <div className="rounded-xl bg-[#6366f1]/5 border border-[#6366f1]/15 p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#6366f1]/10">
                        <Shield className="w-5 h-5 text-[#6366f1]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-foreground" style={{ fontWeight: 600 }}>Админ-панель</p>
                        <p className="text-[11px] text-muted-foreground">
                          Сводка по аккаунтам, связкам, данным и состоянию системы
                        </p>
                      </div>
                      <button
                        onClick={onOpenAdmin}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#6366f1] px-3 py-2 text-[12px] text-white hover:bg-[#5558e8] transition-colors shrink-0"
                        style={{ fontWeight: 600 }}
                      >
                        Открыть
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {rolesList.map((r) => (
                  <div
                    key={r.role}
                    className="rounded-xl bg-muted/30 border border-border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${r.color}15` }}
                      >
                        <Shield className="w-5 h-5" style={{ color: r.color }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>{r.label}</p>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-md"
                            style={{ backgroundColor: `${r.color}15`, color: r.color, fontWeight: 600 }}
                          >
                            {r.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{r.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-[13px] text-foreground tabular-nums" style={{ fontWeight: 500 }}>
                          {r.users}
                        </span>
                      </div>
                    </div>

                    {/* Permissions matrix */}
                    <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2">
                      {[
                        { perm: "Дашборд", all: true },
                        { perm: "Отчёт", all: true },
                        { perm: "Экспорт CSV", all: true },
                        { perm: "Импорт", all: r.role === "controller" || r.role === "analyst" },
                        { perm: "Настройки", all: r.role === "controller" },
                        { perm: "Все ЦФО", all: r.role !== "manager" },
                      ].map((p) => (
                        <span
                          key={p.perm}
                          className={`text-[11px] px-2.5 py-1 rounded-lg ${
                            p.all
                              ? "bg-[#10b981]/10 text-[#10b981]"
                              : "bg-muted/50 text-muted-foreground line-through"
                          }`}
                          style={{ fontWeight: 500 }}
                        >
                          {p.perm}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex items-start gap-2 rounded-xl bg-[#6366f1]/5 border border-[#6366f1]/10 px-4 py-3">
                  <Info className="w-4 h-4 text-[#6366f1] mt-0.5 shrink-0" />
                  <p className="text-[12px] text-muted-foreground">
                    Роли назначаются при регистрации и проверяются backend JWT-слоем.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* References */}
          {activeSection === "references" && (
            <>
              <div>
                <h3 className="text-foreground text-[16px] mb-1" style={{ fontWeight: 600 }}>Справочники</h3>
                <p className="text-[13px] text-muted-foreground">
                  Управление справочниками cost_centers и items для импорта и отчётов
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-2 rounded-xl bg-[#6366f1]/5 border border-[#6366f1]/10 px-4 py-3">
                  <Info className="w-4 h-4 text-[#6366f1] mt-0.5 shrink-0" />
                  <p className="text-[12px] text-muted-foreground">
                    Основное наполнение справочников выполняется через CSV-импорт и сохраняется в PostgreSQL.
                  </p>
                </div>

                <div className="rounded-xl bg-muted/30 border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>ЦФО (`cost_centers`)</p>
                    <span className="text-[11px] px-2 py-1 rounded-lg bg-primary/10 text-primary tabular-nums" style={{ fontWeight: 500 }}>
                      {costCenters.length} записей
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[130px_1fr_1fr_auto] gap-2 mt-3">
                    <input
                      value={newCostCenter.code}
                      onChange={(e) => setNewCostCenter((prev) => ({ ...prev, code: e.target.value }))}
                      placeholder="Код"
                      className="px-3 py-2 rounded-lg bg-card border border-border text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      value={newCostCenter.name}
                      onChange={(e) => setNewCostCenter((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Название ЦФО"
                      className="px-3 py-2 rounded-lg bg-card border border-border text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      value={newCostCenter.owner}
                      onChange={(e) => setNewCostCenter((prev) => ({ ...prev, owner: e.target.value }))}
                      placeholder="Ответственный блок"
                      className="px-3 py-2 rounded-lg bg-card border border-border text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      onClick={handleAddCostCenter}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#2563eb] text-white text-[12px] hover:bg-[#1d4ed8] hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                      style={{ fontWeight: 500 }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Добавить
                    </button>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left">
                      <thead>
                        <tr className="text-[11px] text-muted-foreground border-b border-border">
                          <th className="py-2 pr-3" style={{ fontWeight: 500 }}>Код</th>
                          <th className="py-2 pr-3" style={{ fontWeight: 500 }}>Название</th>
                          <th className="py-2 pr-3" style={{ fontWeight: 500 }}>Ответственный</th>
                          <th className="py-2 pr-3" style={{ fontWeight: 500 }}>Статус</th>
                          <th className="py-2 text-right" style={{ fontWeight: 500 }}>Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {costCenters.map((cc) => {
                          const isEditing = editingCostCenterId === cc.id;
                          return (
                            <tr key={cc.id} className="text-[12px] border-b border-border/60 last:border-0">
                              <td className="py-2 pr-3">
                                {isEditing ? (
                                  <input
                                    value={costCenterDraft.code}
                                    onChange={(e) => setCostCenterDraft((prev) => ({ ...prev, code: e.target.value }))}
                                    className="w-full px-2 py-1.5 rounded-md bg-card border border-border text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  />
                                ) : (
                                  <span className="font-medium text-foreground">{cc.code}</span>
                                )}
                              </td>
                              <td className="py-2 pr-3">
                                {isEditing ? (
                                  <input
                                    value={costCenterDraft.name}
                                    onChange={(e) => setCostCenterDraft((prev) => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-2 py-1.5 rounded-md bg-card border border-border text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  />
                                ) : (
                                  <span className="text-foreground">{cc.name}</span>
                                )}
                              </td>
                              <td className="py-2 pr-3">
                                {isEditing ? (
                                  <input
                                    value={costCenterDraft.owner}
                                    onChange={(e) => setCostCenterDraft((prev) => ({ ...prev, owner: e.target.value }))}
                                    className="w-full px-2 py-1.5 rounded-md bg-card border border-border text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  />
                                ) : (
                                  <span className="text-muted-foreground">{cc.owner}</span>
                                )}
                              </td>
                              <td className="py-2 pr-3">
                                <button
                                  onClick={() => {
                                    if (isEditing) {
                                      setCostCenterDraft((prev) => ({ ...prev, active: !prev.active }));
                                      return;
                                    }
                                    void toggleCostCenterActive(cc);
                                  }}
                                  className={`px-2 py-1 rounded-md text-[11px] ${
                                    (isEditing ? costCenterDraft.active : cc.active)
                                      ? "bg-[#10b981]/10 text-[#10b981]"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                  style={{ fontWeight: 500 }}
                                >
                                  {(isEditing ? costCenterDraft.active : cc.active) ? "Активен" : "Отключен"}
                                </button>
                              </td>
                              <td className="py-2 text-right">
                                <div className="inline-flex items-center gap-1">
                                  {isEditing ? (
                                    <>
                                      <button
                                        onClick={saveCostCenterEdit}
                                        className="p-1.5 rounded-md bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20 transition-colors"
                                        title="Сохранить"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setEditingCostCenterId(null)}
                                        className="p-1.5 rounded-md bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                        title="Отменить"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => startEditCostCenter(cc)}
                                        className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                        title="Редактировать"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => void removeCostCenter(cc)}
                                        className="p-1.5 rounded-md bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 transition-colors"
                                        title="Удалить"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-xl bg-muted/30 border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>Статьи (`items`)</p>
                    <span className="text-[11px] px-2 py-1 rounded-lg bg-primary/10 text-primary tabular-nums" style={{ fontWeight: 500 }}>
                      {expenseItems.length} записей
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[130px_1fr_110px_auto] gap-2 mt-3">
                    <input
                      value={newExpenseItem.code}
                      onChange={(e) => setNewExpenseItem((prev) => ({ ...prev, code: e.target.value }))}
                      placeholder="Код"
                      className="px-3 py-2 rounded-lg bg-card border border-border text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      value={newExpenseItem.name}
                      onChange={(e) => setNewExpenseItem((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Наименование статьи"
                      className="px-3 py-2 rounded-lg bg-card border border-border text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <select
                      value={newExpenseItem.type}
                      onChange={(e) => setNewExpenseItem((prev) => ({ ...prev, type: e.target.value as "OPEX" | "CAPEX" }))}
                      className="px-3 py-2 rounded-lg bg-card border border-border text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="OPEX">OPEX</option>
                      <option value="CAPEX">CAPEX</option>
                    </select>
                    <button
                      onClick={handleAddExpenseItem}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#2563eb] text-white text-[12px] hover:bg-[#1d4ed8] hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                      style={{ fontWeight: 500 }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Добавить
                    </button>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left">
                      <thead>
                        <tr className="text-[11px] text-muted-foreground border-b border-border">
                          <th className="py-2 pr-3" style={{ fontWeight: 500 }}>Код</th>
                          <th className="py-2 pr-3" style={{ fontWeight: 500 }}>Название</th>
                          <th className="py-2 pr-3" style={{ fontWeight: 500 }}>Тип</th>
                          <th className="py-2 pr-3" style={{ fontWeight: 500 }}>Статус</th>
                          <th className="py-2 text-right" style={{ fontWeight: 500 }}>Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenseItems.map((item) => {
                          const isEditing = editingExpenseItemId === item.id;
                          return (
                            <tr key={item.id} className="text-[12px] border-b border-border/60 last:border-0">
                              <td className="py-2 pr-3">
                                {isEditing ? (
                                  <input
                                    value={expenseItemDraft.code}
                                    onChange={(e) => setExpenseItemDraft((prev) => ({ ...prev, code: e.target.value }))}
                                    className="w-full px-2 py-1.5 rounded-md bg-card border border-border text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  />
                                ) : (
                                  <span className="font-medium text-foreground">{item.code}</span>
                                )}
                              </td>
                              <td className="py-2 pr-3">
                                {isEditing ? (
                                  <input
                                    value={expenseItemDraft.name}
                                    onChange={(e) => setExpenseItemDraft((prev) => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-2 py-1.5 rounded-md bg-card border border-border text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  />
                                ) : (
                                  <span className="text-foreground">{item.name}</span>
                                )}
                              </td>
                              <td className="py-2 pr-3">
                                {isEditing ? (
                                  <select
                                    value={expenseItemDraft.type}
                                    onChange={(e) => setExpenseItemDraft((prev) => ({ ...prev, type: e.target.value as "OPEX" | "CAPEX" }))}
                                    className="px-2 py-1.5 rounded-md bg-card border border-border text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  >
                                    <option value="OPEX">OPEX</option>
                                    <option value="CAPEX">CAPEX</option>
                                  </select>
                                ) : (
                                  <span
                                    className={`px-2 py-1 rounded-md text-[11px] ${
                                      item.type === "OPEX" ? "bg-[#06b6d4]/10 text-[#06b6d4]" : "bg-[#f59e0b]/10 text-[#f59e0b]"
                                    }`}
                                    style={{ fontWeight: 500 }}
                                  >
                                    {item.type}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 pr-3">
                                <button
                                  onClick={() => {
                                    if (isEditing) {
                                      setExpenseItemDraft((prev) => ({ ...prev, active: !prev.active }));
                                      return;
                                    }
                                    void toggleExpenseItemActive(item);
                                  }}
                                  className={`px-2 py-1 rounded-md text-[11px] ${
                                    (isEditing ? expenseItemDraft.active : item.active)
                                      ? "bg-[#10b981]/10 text-[#10b981]"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                  style={{ fontWeight: 500 }}
                                >
                                  {(isEditing ? expenseItemDraft.active : item.active) ? "Активен" : "Отключен"}
                                </button>
                              </td>
                              <td className="py-2 text-right">
                                <div className="inline-flex items-center gap-1">
                                  {isEditing ? (
                                    <>
                                      <button
                                        onClick={saveExpenseItemEdit}
                                        className="p-1.5 rounded-md bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20 transition-colors"
                                        title="Сохранить"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setEditingExpenseItemId(null)}
                                        className="p-1.5 rounded-md bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                        title="Отменить"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => startEditExpenseItem(item)}
                                        className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                        title="Редактировать"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => void removeExpenseItem(item)}
                                        className="p-1.5 rounded-md bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 transition-colors"
                                        title="Удалить"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Display */}
          {activeSection === "display" && (
            <>
              <div>
                <h3 className="text-foreground text-[16px] mb-1" style={{ fontWeight: 600 }}>Отображение</h3>
                <p className="text-[13px] text-muted-foreground">
                  Формат чисел, валюта, визуальные настройки
                </p>
              </div>

              <div className="space-y-4">
                {/* Number format */}
                <div>
                  <label className="text-[12px] text-muted-foreground mb-2 block" style={{ fontWeight: 500 }}>
                    Формат чисел
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "ru", label: "Русский", example: "1 234 567,89", desc: "Пробел + запятая" },
                      { key: "en", label: "Английский", example: "1,234,567.89", desc: "Запятая + точка" },
                    ].map((fmt) => (
                      <button
                        key={fmt.key}
                        onClick={() => {
                          setNumberFormat(fmt.key as "ru" | "en");
                          toast.success(`Формат: ${fmt.label}`, { description: `Пример: ${fmt.example}` });
                        }}
                        className={`rounded-xl border p-4 text-left transition-all ${
                          numberFormat === fmt.key
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>{fmt.label}</p>
                        <p className="text-[18px] text-primary tabular-nums mt-1" style={{ fontWeight: 600 }}>{fmt.example}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{fmt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Currency */}
                <div>
                  <label className="text-[12px] text-muted-foreground mb-2 block" style={{ fontWeight: 500 }}>
                    Валюта
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: "RUB", symbol: "₽" },
                      { key: "USD", symbol: "$" },
                      { key: "EUR", symbol: "€" },
                    ].map((c) => (
                      <button
                        key={c.key}
                        onClick={() => {
                          setCurrency(c.key);
                          toast(`Валюта: ${c.key}`, { description: `Символ: ${c.symbol}` });
                        }}
                        className={`rounded-xl border p-3 text-center transition-all ${
                          currency === c.key
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <p className="text-[20px]" style={{ fontWeight: 600 }}>{c.symbol}</p>
                        <p className="text-[12px] text-muted-foreground mt-1">{c.key}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Data management */}
          {activeSection === "data" && (
            <>
              <div>
                <h3 className="text-foreground text-[16px] mb-1" style={{ fontWeight: 600 }}>Управление данными</h3>
                <p className="text-[13px] text-muted-foreground">
                  Очистка витрины, реимпорт, просмотр логов
                </p>
              </div>

              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: `Строк ${dataKind}`, value: String(dataEntries.length), color: "#6366f1" },
                    { label: "Показано", value: String(filteredDataEntries.length), color: "#06b6d4" },
                    { label: "Лимит выборки", value: "300", color: "#10b981" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-muted/30 border border-border p-3 text-center">
                      <p className="text-[20px] tabular-nums" style={{ fontWeight: 600, color: s.color }}>{s.value}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-muted/30 border border-border p-4 space-y-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>Редактор строк plan/fact</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Исправьте лишнюю строку после CSV без повторного импорта файла</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(["plan", "fact"] as DataKind[]).map((kind) => (
                        <button
                          key={kind}
                          onClick={() => setDataKind(kind)}
                          className={`px-3 py-2 rounded-lg text-[12px] transition-all ${
                            dataKind === kind ? "bg-primary/10 text-primary" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                          }`}
                          style={{ fontWeight: 500 }}
                        >
                          {kind}
                        </button>
                      ))}
                      <button
                        onClick={() => loadDataEntries(dataKind)}
                        className="px-3 py-2 rounded-lg bg-card border border-border text-[12px] text-muted-foreground hover:text-foreground transition-all"
                        style={{ fontWeight: 500 }}
                      >
                        Обновить
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    <input value={dataDraft.period} onChange={(e) => setDataDraft((prev) => ({ ...prev, period: e.target.value }))} placeholder="period YYYY-MM" className="px-3 py-2 rounded-lg bg-card border border-border text-[12px] outline-none focus:border-primary/40" />
                    <input value={dataDraft.cc_id} onChange={(e) => setDataDraft((prev) => ({ ...prev, cc_id: e.target.value }))} placeholder="cc_id" className="px-3 py-2 rounded-lg bg-card border border-border text-[12px] outline-none focus:border-primary/40" />
                    <input value={dataDraft.item_id} onChange={(e) => setDataDraft((prev) => ({ ...prev, item_id: e.target.value }))} placeholder="item_id" className="px-3 py-2 rounded-lg bg-card border border-border text-[12px] outline-none focus:border-primary/40" />
                    <input value={dataDraft.amount} onChange={(e) => setDataDraft((prev) => ({ ...prev, amount: e.target.value }))} placeholder={dataKind === "plan" ? "amount_plan" : "amount_fact"} className="px-3 py-2 rounded-lg bg-card border border-border text-[12px] outline-none focus:border-primary/40" />
                    <button onClick={handleSaveDataEntry} className="px-3 py-2 rounded-lg bg-[#2563eb] text-white text-[12px] hover:bg-[#1d4ed8] transition-all" style={{ fontWeight: 500 }}>Сохранить</button>
                  </div>

                  <input
                    value={dataSearch}
                    onChange={(e) => setDataSearch(e.target.value)}
                    placeholder="Поиск по периоду, ЦФО, статье, id..."
                    className="w-full px-3 py-2 rounded-lg bg-card border border-border text-[12px] outline-none focus:border-primary/40"
                  />

                  <div className="max-h-[360px] overflow-auto rounded-lg border border-border bg-card">
                    <table className="w-full text-[12px]">
                      <thead className="sticky top-0 bg-muted text-muted-foreground">
                        <tr>
                          {["Период", "ЦФО", "Статья", "Тип", "Сумма", ""].map((col) => (
                            <th key={col} className="px-3 py-2 text-left" style={{ fontWeight: 500 }}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dataLoading ? (
                          <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Загрузка...</td></tr>
                        ) : filteredDataEntries.length === 0 ? (
                          <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Строк пока нет</td></tr>
                        ) : filteredDataEntries.map((entry) => (
                          <tr key={`${entry.kind}-${entry.period}-${entry.cc_id}-${entry.item_id}`} className="border-t border-border/60">
                            <td className="px-3 py-2 tabular-nums">{entry.period}</td>
                            <td className="px-3 py-2">{entry.cc_name} <span className="text-muted-foreground">#{entry.cc_id}</span></td>
                            <td className="px-3 py-2">{entry.item_name} <span className="text-muted-foreground">#{entry.item_id}</span></td>
                            <td className="px-3 py-2">{entry.type}</td>
                            <td className="px-3 py-2 tabular-nums">{entry.amount.toLocaleString("ru-RU")}</td>
                            <td className="px-3 py-2 text-right">
                              <button
                                onClick={() => setDataDraft({ period: entry.period, cc_id: String(entry.cc_id), item_id: String(entry.item_id), amount: String(entry.amount) })}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDataEntry(entry)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Import log */}
                <div className="rounded-xl bg-muted/30 border border-border p-4">
                  <p className="text-[13px] text-foreground mb-3" style={{ fontWeight: 500 }}>Последние импорты текущей компании</p>
                  <div className="space-y-2">
                    {importLogs.length === 0 ? (
                      <div className="rounded-xl bg-card border border-border px-4 py-6 text-center text-[12px] text-muted-foreground">
                        Импортов у этой компании пока нет
                      </div>
                    ) : importLogs.map((log, i) => (
                      <div key={`${log.imported_at}-${log.kind}-${i}`} className="flex items-center gap-3 text-[12px] py-2 border-b border-border/50 last:border-0">
                        <span className="text-muted-foreground tabular-nums w-32 shrink-0">{formatImportDate(log.imported_at)}</span>
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary" style={{ fontWeight: 500 }}>
                          {log.kind}
                        </span>
                        <span className="text-foreground flex-1 truncate">{log.filename}</span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] ${
                            log.status === "SUCCESS" ? "bg-[#10b981]/10 text-[#10b981]" : "bg-[#ef4444]/10 text-[#ef4444]"
                          }`}
                          style={{ fontWeight: 500 }}
                        >
                          {log.status}
                        </span>
                        <span className="text-muted-foreground tabular-nums">{log.inserted + log.updated} rows</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Danger zone */}
                <div className="rounded-xl bg-[#ef4444]/5 border border-[#ef4444]/15 p-4">
                  <p className="text-[13px] text-[#ef4444] mb-2" style={{ fontWeight: 500 }}>Опасная зона</p>
                  {!showConfirmClear ? (
                    <button
                      onClick={() => setShowConfirmClear(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ef4444]/10 text-[#ef4444] text-[13px] hover:bg-[#ef4444]/20 transition-all"
                      style={{ fontWeight: 500 }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Очистить витрину (plan + fact)
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <p className="text-[12px] text-muted-foreground">
                        Вы уверены? Будут удалены все записи plan и fact. Справочники (cost_centers, items) останутся.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleClearData}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ef4444] text-white text-[13px] hover:bg-[#ef4444]/90 transition-all"
                          style={{ fontWeight: 500 }}
                        >
                          <Trash2 className="w-4 h-4" />
                          Да, очистить
                        </button>
                        <button
                          onClick={() => setShowConfirmClear(false)}
                          className="px-4 py-2 rounded-xl bg-card border border-border text-[13px] text-muted-foreground hover:text-foreground transition-all"
                          style={{ fontWeight: 500 }}
                        >
                          Отмена
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
