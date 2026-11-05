import { useEffect, useId, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Flag,
  Gauge,
  LineChart,
  ListOrdered,
  Mail,
  Menu,
  Plug,
  X,
} from "lucide-react";

const STORAGE_KEY = "3consulting-letter";

const NAV = [
  { href: "#product", label: "Продукт" },
  { href: "#features", label: "Возможности" },
  { href: "#pricing", label: "Тарифы" },
  { href: "#stories", label: "Истории" },
] as const;

const QUEUE = [
  {
    name: "Северная полка",
    score: 42,
    width: "w-2/5",
    reason: "Не заходили 11 дней",
    when: "Сегодня",
    risk: true,
    draft:
      "Марина, за 11 дней команда не открыла отчёты. Обычно к этому моменту вы смотрите оборачиваемость. Могу показать, где отчёт остановился?",
  },
  {
    name: "Лампа CRM",
    score: 61,
    width: "w-3/5",
    reason: "Счёт просрочен на 6 дней",
    when: "Сегодня",
    risk: true,
  },
  {
    name: "Поле",
    score: 55,
    width: "w-1/2",
    reason: "Онбординг завис на шаге 3",
    when: "Завтра",
    risk: true,
  },
  {
    name: "Тихая гавань",
    score: 88,
    width: "w-4/5",
    reason: "Всё спокойно, касание на неделе",
    when: "Пятница",
    risk: false,
  },
] as const;

const STEPS = [
  {
    n: "01",
    title: "Ночью собираются сигналы",
    text: "Входы в продукт, просроченные счета и тикеты без ответа складываются в один балл. Таблицу больше никто не сводит.",
  },
  {
    n: "02",
    title: "К девяти — очередь из десяти",
    text: "В списке только те, кого ещё реально удержать. У каждого причина и срок, а не сорок столбцов на выбор.",
  },
  {
    n: "03",
    title: "Касание уходит с факта",
    text: "Первый абзац уже написан по аккаунту. Вы правите тон и закрываете карточку — утро закончено до планёрки.",
  },
] as const;

const FEATURES = [
  {
    icon: Gauge,
    title: "Здоровье аккаунта",
    text: "Один балл из входов, счетов и тикетов. Упал ниже порога — человек в очереди, без ручной сортировки.",
  },
  {
    icon: ListOrdered,
    title: "Очередь дня",
    text: "Десять контактов с причиной и сроком. Остальные не мешают. Завтра список соберётся заново.",
  },
  {
    icon: Mail,
    title: "Черновик касания",
    text: "Первый абзац на фактах аккаунта: что клиент перестал делать и что предложить. Вы правите тон, не ищете повод.",
  },
  {
    icon: Flag,
    title: "Первая неделя",
    text: "Чеклист онбординга закрывается сам, когда клиент делает шаг в продукте. Застрял — попадает к вам на третий день.",
  },
  {
    icon: LineChart,
    title: "Прогноз продлений",
    text: "Кто дойдёт до даты счёта, кто завис и сколько выручки ещё можно вернуть в этом квартале.",
  },
  {
    icon: Plug,
    title: "Интеграции без проекта",
    text: "amoCRM, Битрикс24, Stripe и вебхук. Подключение за час, не за спринт команды внедрения.",
  },
] as const;

const PLANS = [
  {
    id: "start",
    name: "Старт",
    blurb: "Пилот на одном человеке и живой очереди.",
    monthly: 0,
    yearly: 0,
    intent: "pilot" as const,
    cta: "Открыть очередь",
    features: ["1 место", "До 50 аккаунтов", "Оценка здоровья", "Очередь дня"],
  },
  {
    id: "team",
    name: "Команда",
    blurb: "Для тех, кто пишет клиентам каждый день.",
    monthly: 6900,
    yearly: 5520,
    intent: "pilot" as const,
    cta: "Начать 14 дней",
    features: [
      "5 мест",
      "До 500 аккаунтов",
      "Черновики касаний",
      "Плейбук первой недели",
      "amoCRM и Битрикс24",
    ],
  },
  {
    id: "company",
    name: "Компания",
    blurb: "Когда отток считается в выручке, а не в ощущениях.",
    monthly: 19000,
    yearly: 15200,
    intent: "talk" as const,
    cta: "Поговорить с нами",
    features: ["Места без лимита", "Прогноз продлений", "Роли и SSO", "Приоритетная линия"],
  },
] as const;

const STORIES = [
  {
    quote:
      "В понедельник больше нет планёрки «кого мы забыли». Список уже стоит, и в нём не сорок имён.",
    name: "Алина Реброва",
    role: "Руководитель успеха, Поле",
    mark: "АР",
  },
  {
    quote:
      "Новый человек в команде на второй день понимает, кому писать. Раньше для этого нужна была моя голова.",
    name: "Игорь Самойлов",
    role: "Основатель, Лампа CRM",
    mark: "ИС",
  },
  {
    quote:
      "Черновики суховаты — и это плюс. Мы начинаем с факта, а не с «как ваши дела?». На письма стали отвечать.",
    name: "Софья Левина",
    role: "Операционный директор, Северная полка",
    mark: "СЛ",
  },
] as const;

type Intent = "pilot" | "talk";
type Billing = "month" | "year";

function money(n: number) {
  return new Intl.NumberFormat("ru-RU").format(n);
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

const tap =
  "transition-transform duration-150 ease-out active:not-disabled:scale-[0.96]";

const btnInk = `${tap} inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-paper`;
const btnGhost = `${tap} inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line bg-card px-5 text-sm font-semibold text-ink`;
const btnPaper = `${tap} inline-flex h-12 items-center justify-center gap-2 rounded-full bg-paper px-5 text-sm font-semibold text-ink`;

export function HomePage() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [billing, setBilling] = useState<Billing>("year");
  const [intent, setIntent] = useState<Intent>("pilot");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const emailId = useId();
  const errorId = useId();
  const menuId = useId();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSaved(stored);
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function go(next: Intent) {
    setIntent(next);
    setOpen(false);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("start")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = email.trim();
    if (!next) {
      setError("Напишите почту, куда прислать доступ.");
      return;
    }
    if (!validEmail(next)) {
      setError("Нужна почта вида имя@компания.ru.");
      return;
    }
    setError("");
    setSaved(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  function resetLetter() {
    setSaved(null);
    setEmail("");
    setError("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="bg-paper text-ink">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        К содержанию
      </a>

      <header
        className={`sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-200 ${
          scrolled || open
            ? "border-line bg-paper/95 shadow-lift backdrop-blur-md"
            : "border-transparent bg-glow"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5">
          <a href="#top" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="headline grid size-9 place-items-center rounded-xl bg-ink text-lg text-paper">
              3
            </span>
            3Consulting
          </a>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Разделы">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-2 text-sm font-medium text-ink/80 hover:bg-card hover:text-ink"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a href="#start" className={`${btnInk} h-11 px-4 md:h-12 md:px-5`}>
              <span className="md:hidden">Начать</span>
              <span className="hidden md:inline">Попробовать бесплатно</span>
            </a>
            <button
              type="button"
              className={`${tap} grid size-11 place-items-center rounded-full border border-line bg-card md:hidden`}
              aria-expanded={open}
              aria-controls={menuId}
              onClick={() => setOpen((value) => !value)}
            >
              <span className="sr-only">{open ? "Закрыть меню" : "Открыть меню"}</span>
              {open ? <X aria-hidden /> : <Menu aria-hidden />}
            </button>
          </div>
        </div>

        <div id={menuId} className={open ? "border-t border-line md:hidden" : "hidden"} hidden={!open}>
          <nav className="mx-auto flex max-w-6xl flex-col px-5 py-3" aria-label="Разделы">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex h-12 items-center text-base font-medium"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main id="content">
        <section id="top" className="bg-glow scroll-mt-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pt-10 pb-16 lg:grid-cols-12 lg:gap-12 lg:pt-16 lg:pb-24">
            <div className="lg:col-span-6">
              <p className="text-sm font-semibold text-coral">Для команд удержания</p>
              <h1 className="headline mt-3 text-4xl text-ink sm:text-5xl lg:text-6xl">
                Десять клиентов, которым ещё можно <span className="text-coral">помочь</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted">
                3Consulting смотрит продукт, счета и тикеты и каждое утро ставит в очередь только тех, кого
                ещё реально удержать. С причиной и первым абзацем — не с таблицей на сорок столбцов.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button type="button" className={btnInk} onClick={() => go("pilot")}>
                  Попробовать 14 дней
                  <ArrowRight aria-hidden className="size-4" />
                </button>
                <a href="#product" className={btnGhost}>
                  Как устроено утро
                </a>
              </div>
              <dl className="mt-10 grid grid-cols-3 gap-3 border-t border-ink/10 pt-6">
                <div>
                  <dt className="headline text-2xl tabular-nums sm:text-3xl">−18%</dt>
                  <dd className="mt-1 text-sm text-muted">отток за квартал</dd>
                </div>
                <div>
                  <dt className="headline text-2xl tabular-nums sm:text-3xl">6 ч</dt>
                  <dd className="mt-1 text-sm text-muted">меньше на разбор</dd>
                </div>
                <div>
                  <dt className="headline text-2xl tabular-nums sm:text-3xl">10</dt>
                  <dd className="mt-1 text-sm text-muted">контактов с утра</dd>
                </div>
              </dl>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-3xl border border-line bg-card p-4 shadow-lift sm:p-6">
                <div className="flex items-start justify-between gap-3 border-b border-line pb-4">
                  <div>
                    <p className="text-sm text-muted">Сегодня · утро</p>
                    <p className="headline text-2xl">Очередь дня</p>
                  </div>
                  <p className="rounded-full bg-ink px-3 py-1 text-sm font-medium text-paper">4 из 10</p>
                </div>
                <ul className="divide-y divide-line">
                  {QUEUE.map((row) => (
                    <li key={row.name} className="py-4">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate font-semibold">{row.name}</p>
                        <p
                          className={`tabular-nums text-sm font-semibold ${row.risk ? "text-coral" : "text-muted"}`}
                        >
                          {row.score}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3 text-sm text-muted">
                        <p>{row.reason}</p>
                        <p className="shrink-0 font-medium text-ink">{row.when}</p>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper">
                        <div
                          className={`h-full rounded-full ${row.risk ? "bg-coral" : "bg-ink"} ${row.width}`}
                        />
                      </div>
                      {"draft" in row ? (
                        <div className="mt-3 rounded-2xl bg-glow px-4 py-3 text-sm leading-relaxed">
                          <p className="font-semibold text-coral">Черновик</p>
                          <p className="mt-1">«{row.draft}»</p>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-3 text-sm text-muted">
                Черновик уже на фактах аккаунта. Ни одного «как ваши дела?».
              </p>
            </div>
          </div>
        </section>

        <section id="product" className="scroll-mt-20 border-b border-line">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:py-24">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-coral">Продукт</p>
              <h2 className="headline mt-3 text-3xl sm:text-4xl">
                3Consulting не рисует ещё один дашборд. Он закрывает утро.
              </h2>
            </div>
            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {STEPS.map((step) => (
                <li key={step.n}>
                  <p className="headline text-sm text-coral tabular-nums">{step.n}</p>
                  <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="features" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:py-24">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-coral">Возможности</p>
                <h2 className="headline mt-3 text-3xl sm:text-4xl">
                  Всё, что нужно, чтобы написать вовремя. Ничего, что откладывает письмо.
                </h2>
              </div>
              <a href="#pricing" className={`${btnGhost} shrink-0`}>
                Смотреть тарифы
                <ArrowRight aria-hidden className="size-4" />
              </a>
            </div>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li
                    key={feature.title}
                    className="rounded-3xl border border-line bg-card p-6 transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-ink"
                  >
                    <Icon aria-hidden className="size-5 text-coral" />
                    <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-muted">{feature.text}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-20 border-y border-line bg-card">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:py-24">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-coral">Тарифы</p>
                <h2 className="headline mt-3 text-3xl sm:text-4xl">
                  Начните с очереди. Платите, когда писем станет много.
                </h2>
              </div>
              <div
                role="group"
                aria-label="Период оплаты"
                className="inline-flex rounded-full border border-line bg-paper p-1"
              >
                <button
                  type="button"
                  aria-pressed={billing === "month"}
                  className={`${tap} h-11 rounded-full px-4 text-sm font-semibold ${
                    billing === "month" ? "bg-ink text-paper" : "text-muted"
                  }`}
                  onClick={() => setBilling("month")}
                >
                  Месяц
                </button>
                <button
                  type="button"
                  aria-pressed={billing === "year"}
                  className={`${tap} h-11 rounded-full px-4 text-sm font-semibold ${
                    billing === "year" ? "bg-ink text-paper" : "text-muted"
                  }`}
                  onClick={() => setBilling("year")}
                >
                  Год
                  <span className={billing === "year" ? "text-glow" : "text-coral"}> −20%</span>
                </button>
              </div>
            </div>

            <ul className="mt-10 grid items-stretch gap-4 lg:grid-cols-3">
              {PLANS.map((plan) => {
                const featured = plan.id === "team";
                const price = billing === "year" ? plan.yearly : plan.monthly;
                return (
                  <li
                    key={plan.id}
                    className={`flex flex-col rounded-3xl border p-6 ${
                      featured
                        ? "border-ink bg-ink text-paper shadow-lift"
                        : "border-line bg-paper text-ink"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      {featured ? (
                        <span className="rounded-full bg-coral px-3 py-1 text-sm font-semibold text-paper">
                          Чаще берут
                        </span>
                      ) : null}
                    </div>
                    <p className={`mt-2 text-sm ${featured ? "text-mist" : "text-muted"}`}>{plan.blurb}</p>
                    <p className="mt-6 flex items-end gap-2">
                      <span className="headline text-4xl tabular-nums">{money(price)}&nbsp;₽</span>
                      <span className={`mb-1 text-sm ${featured ? "text-mist" : "text-muted"}`}>
                        {price === 0 ? "бесплатно" : "в месяц"}
                      </span>
                    </p>
                    {billing === "year" && plan.monthly > 0 ? (
                      <p className={`mt-1 text-sm tabular-nums ${featured ? "text-mist" : "text-muted"}`}>
                        <span className="line-through">{money(plan.monthly)}&nbsp;₽</span>
                        {" · "}счёт раз в год
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-transparent" aria-hidden>
                        .
                      </p>
                    )}
                    <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm">
                      {plan.features.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-coral" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className={`mt-8 w-full ${featured ? btnPaper : btnInk}`}
                      onClick={() => go(plan.intent)}
                    >
                      {plan.cta}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section id="stories" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:py-24">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-coral">Истории</p>
              <h2 className="headline mt-3 text-3xl sm:text-4xl">
                Команды, которые перестали узнавать об уходе из письма «мы не продлеваемся».
              </h2>
            </div>
            <ul className="mt-10 grid gap-4 lg:grid-cols-3">
              {STORIES.map((story) => (
                <li key={story.name} className="flex flex-col rounded-3xl border border-line bg-card p-6">
                  <blockquote className="text-lg leading-relaxed">«{story.quote}»</blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <span className="headline grid size-11 place-items-center rounded-full bg-glow text-sm text-coral">
                      {story.mark}
                    </span>
                    <span>
                      <span className="block font-semibold">{story.name}</span>
                      <span className="block text-sm text-muted">{story.role}</span>
                    </span>
                  </figcaption>
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-3xl bg-glow px-6 py-6 sm:flex-row sm:items-center">
              <p className="headline max-w-xl text-2xl">Хотите такой понедельник?</p>
              <button type="button" className={btnInk} onClick={() => go("pilot")}>
                Открыть свою очередь
                <ArrowRight aria-hidden className="size-4" />
              </button>
            </div>
          </div>
        </section>

        <section id="start" className="scroll-mt-20 bg-glow">
          <div className="mx-auto max-w-3xl px-5 py-16 lg:py-24">
            <p className="text-sm font-semibold text-coral">
              {intent === "talk" ? "Разговор" : "14 дней без карты"}
            </p>
            <h2 className="headline mt-3 text-3xl sm:text-5xl">
              {intent === "talk"
                ? "Оставьте почту — ответим в тот же рабочий день."
                : "Письмо раз в две недели. Один приём, ноль воды."}
            </h2>
            <p className="mt-4 text-lg text-muted">
              {intent === "talk"
                ? "Расскажем, как очередь садится на ваши счета и CRM. Без презентации на сорок слайдов."
                : "Доступ к пилоту и короткая заметка: один приём удержания, который можно поставить в работу до обеда."}
            </p>

            {saved ? (
              <div role="status" className="mt-8 rounded-3xl border border-line bg-card p-6">
                <p className="headline text-3xl">Вы в списке.</p>
                <p className="mt-3 text-muted">
                  Написали на <span className="font-semibold text-ink">{saved}</span>. В этом демо адрес
                  остаётся только в вашем браузере и никуда не отправляется.
                </p>
                <button type="button" className={`${btnGhost} mt-6`} onClick={resetLetter}>
                  Указать другую почту
                </button>
              </div>
            ) : (
              <form noValidate className="mt-8" onSubmit={onSubmit}>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <label htmlFor={emailId} className="sr-only">
                    Электронная почта
                  </label>
                  <input
                    id={emailId}
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="имя@компания.ru"
                    value={email}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (error) setError("");
                    }}
                    className="h-12 w-full rounded-full border border-line bg-card px-5 text-base text-ink placeholder:text-muted"
                  />
                  <button type="submit" className={`${btnInk} shrink-0`}>
                    {intent === "talk" ? "Жду ответа" : "Получить доступ"}
                  </button>
                </div>
                {error ? (
                  <p id={errorId} className="mt-3 text-sm font-medium text-coral" role="alert">
                    {error}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-muted">
                    Без рассылки «на всякий случай». Адрес в демо не уходит на сервер.
                  </p>
                )}
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 font-semibold">
            <span className="headline grid size-8 place-items-center rounded-lg bg-ink text-paper">3</span>
            3Consulting
          </p>
          <p className="text-sm text-muted">Очередь удержания. Демонстрационный лендинг.</p>
          <a href="#start" className="text-sm font-semibold text-ink">
            Начать бесплатно
          </a>
        </div>
      </footer>
    </div>
  );
}
