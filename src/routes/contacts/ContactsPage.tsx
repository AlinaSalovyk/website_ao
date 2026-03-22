import { useState, useRef, type JSX } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Footer } from "@/components/layout/Footer";
import { Separator } from "@/components/ui/separator";
import * as Accordion from "@radix-ui/react-accordion";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
} from "@/components/icons/social";

const faqItems = [
  {
    question: "Які освітні програми доступні в Інституті ІТ та бізнесу?",
    answer:
      "Інститут пропонує бакалаврські та магістерські програми в галузях інформаційних технологій, бізнес-аналітики, фінансів, менеджменту та маркетингу.",
  },
  {
    question: "Які документи потрібні для вступу?",
    answer:
      "Для вступу необхідні сертифікати НМТ (для бакалаврів), диплом бакалавра та ЄВІ/ЄФВВ (для магістратури), паспорт, ідентифікаційний код та інші документи згідно з вимогами приймальної комісії.",
  },
  {
    question: "Чи є можливість навчання за кордоном?",
    answer:
      "Так! Ми співпрацюємо з міжнародними університетами та пропонуємо студентам програми обміну та стажування за кордоном.",
  },
  {
    question: "Чи передбачена дуальна освіта або стажування у компаніях?",
    answer:
      "Так, ми активно співпрацюємо з провідними ІТ-компаніями, банками та бізнес-організаціями, надаючи студентам можливість проходити стажування та працювати над реальними кейсами.",
  },
];

const RECIPIENT_EMAIL = "93e01c640924de638e41437f227fc24e";

export const ContactsPage = (): JSX.Element => {
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");

    const formData = new FormData(e.currentTarget);
    const honeypot = formData.get("_honeypot");
    if (honeypot) return;

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const region = formData.get("region") as string;
    const message = formData.get("message") as string;

    try {
      const res = await fetch(`https://formsubmit.co/ajax/${RECIPIENT_EMAIL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: "Нове повідомлення з сайту Інституту ІТ та бізнесу",
          _template: "box",
          "Ім'я": `${firstName} ${lastName}`,
          "Email відправника": email,
          "Повідомлення": message,
        }),
      });

      if (res.ok) {
        setStatus("idle");
        formRef.current?.reset();
        toast.success("Повідомлення успішно надіслано!", { position: "top-center" });
      } else {
        setStatus("idle");
        toast.error("Помилка надсилання. Спробуйте ще раз.", { position: "top-center" });
      }
    } catch {
      setStatus("idle");
      toast.error("Помилка надсилання. Спробуйте ще раз.", { position: "top-center" });
    }
  };

  return (
    <>
      <div className="w-full bg-pure-white flex flex-col items-center">
        <div className="w-full max-w-7xl 2xl:max-w-screen-2xl px-4 md:px-9 flex flex-col pt-10 pb-32 md:pb-48 gap-16 md:gap-24">
          {/* Hero Section */}
          <div className="flex flex-col gap-6 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
            <div className="flex flex-col gap-8 md:flex-row md:justify-between md:items-start">
              <h1 className="font-medium text-4xl md:text-6xl lg:text-[80px] leading-[1.1] tracking-tight text-pure-black max-w-4xl text-left">
                Час приєднатися до <br className="hidden md:block" />
                інституту ІТ та Бізнесу
              </h1>
            </div>

            <p className="text-xl md:text-2xl text-pure-black/80">
              Створюй власне майбутнє разом з нами!
            </p>
            <Separator className="bg-pure-black/20" />
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
            {/* Left Column - Director Info */}
            <div className="flex flex-col sm:flex-row items-start gap-6 lg:gap-10 w-full group">
              <div className="w-full sm:w-[220px] h-[280px] overflow-hidden rounded-2xl flex-shrink-0 bg-gray-200">
                <img
                  src="/images/InstituteManagement/novoseletskyy.webp"
                  alt="Новоселецький Олександр Миколайович"
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <div className="flex flex-col text-left py-2 flex-1 h-full max-w-md">
                <h3 className="font-bold text-[16px] md:text-[17px] text-black mb-1.5">
                  Новоселецький Олександр Миколайович
                </h3>

                <p className="text-[11px] md:text-[12px] text-black max-w-[360px] leading-[1.4] mb-8 font-normal">
                  Директор Інституту ІТ та бізнесу, кандидат економічних наук,
                  доцент кафедри інформаційних технологій та аналітики даних
                </p>

                {/* Contact & Socials Group */}
                <div className="flex flex-col gap-5 md:gap-5 mt-16">
                  <div className="flex flex-col">
                    <p className="text-[12px] md:text-[13px] text-black mb-0.5">
                      Контактна інформація:
                    </p>
                    <a
                      href="mailto:oleksandr.novoseletskyy@oa.edu.ua"
                      className="text-[12px] md:text-[13px] text-black hover:underline"
                    >
                      e-mail: oleksandr.novoseletskyy@oa.edu.ua
                    </a>
                  </div>

                  <div className="flex gap-4 lg:gap-6">
                    <a
                      href="#"
                      className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border border-pure-black flex items-center justify-center transition-all hover:bg-pure-black group/social"
                    >
                      <div className="w-9 h-9 lg:w-20 lg:h-30 group-hover/social:invert group-hover/social:brightness-0 group-hover/social:filter transition-all flex items-center justify-center translate-y-[1px]">
                        <InstagramIcon
                          iconColor="fill-pure-black"
                          borderColor="fill-transparent"
                          iconSize="size-full"
                        />
                      </div>
                    </a>
                    <a
                      href="#"
                      className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border border-pure-black flex items-center justify-center transition-all hover:bg-pure-black group/social"
                    >
                      <div className="w-9 h-9 lg:w-20 lg:h-30 group-hover/social:invert group-hover/social:brightness-0 group-hover/social:filter transition-all flex items-center justify-center translate-y-[1px]">
                        <FacebookIcon
                          iconColor="fill-pure-black"
                          borderColor="fill-transparent"
                          iconSize="size-full"
                        />
                      </div>
                    </a>
                    <a
                      href="#"
                      className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border border-pure-black flex items-center justify-center transition-all hover:bg-pure-black group/social"
                    >
                      <div className="w-9 h-9 lg:w-20 lg:h-30 group-hover/social:invert group-hover/social:brightness-0 group-hover/social:filter transition-all flex items-center justify-center translate-y-[1px]">
                        <LinkedInIcon
                          iconColor="fill-pure-black"
                          borderColor="fill-transparent"
                          iconSize="size-full"
                        />
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <form
              ref={formRef}
              className="flex flex-col gap-8 w-full"
              onSubmit={handleSubmit}
            >
              <input type="text" name="_honeypot" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="contact-first-name"
                    className="text-[10px] uppercase font-bold tracking-wider text-pure-black"
                  >
                    Ім'я
                  </label>
                  <input
                    id="contact-first-name"
                    name="firstName"
                    type="text"
                    required
                    placeholder="Бен"
                    className="border-b border-pure-black/20 pb-2 outline-none focus:border-pure-black transition-colors bg-transparent placeholder:text-black/20 text-pure-black"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="contact-last-name"
                    className="text-[10px] uppercase font-bold tracking-wider text-pure-black"
                  >
                    Прізвище
                  </label>
                  <input
                    id="contact-last-name"
                    name="lastName"
                    type="text"
                    required
                    placeholder="Марк"
                    className="border-b border-pure-black/20 pb-2 outline-none focus:border-pure-black transition-colors bg-transparent placeholder:text-black/20 text-pure-black"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="contact-email"
                  className="text-[10px] uppercase font-bold tracking-wider text-pure-black"
                >
                  Email
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  placeholder="ben@gmail.com"
                  className="border-b border-pure-black/20 pb-2 outline-none focus:border-pure-black transition-colors bg-transparent placeholder:text-black/20 text-pure-black"
                />
              </div>

              <div className="flex flex-col gap-2 relative">
                <label
                  htmlFor="contact-message"
                  className="text-[10px] uppercase font-bold tracking-wider text-pure-black"
                >
                  Повідомлення
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  placeholder="Розкажи нам більше, або постав питання"
                  rows={1}
                  className="border-b border-pure-black/20 pb-2 outline-none focus:border-pure-black transition-colors bg-transparent resize-none placeholder:text-black/20 text-pure-black overflow-y-auto w-full absolute top-[18px] left-0 md:bg-[#fcfcfc] sm:bg-[#fcfcfc]"
                  style={{
                    minHeight: "32px",
                    maxHeight: "80px",
                  }}
                  onInput={(e) => {
                    e.currentTarget.style.height = "32px";
                    e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                  }}
                ></textarea>
                <div className="w-full h-[32px] invisible"></div>
              </div>

              <div className="flex flex-col gap-3 mt-6">
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-fit flex gap-4 items-center border-b border-pure-black pb-1 cursor-pointer hover:opacity-70 transition-opacity group bg-transparent relative z-10 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="text-xs font-medium text-pure-black">
                    {status === "sending" ? "Надсилання..." : "Надіслати повідомлення"}
                  </span>
                  {status !== "sending" && (
                    <svg
                      width="18"
                      height="12"
                      viewBox="0 0 18 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="transform group-hover:translate-x-1 transition-transform"
                    >
                      <path
                        d="M12.5 1L17 6M17 6L12.5 11M17 6H0"
                        stroke="black"
                        strokeWidth="1"
                      />
                    </svg>
                  )}
                </button>

              </div>
            </form>
          </div>

          {/* FAQ Section */}
          <div className="w-full md:w-1/2 md:max-w-[48%] self-start flex flex-col gap-8 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:800ms]">
            <Accordion.Root
              type="multiple"
              className="w-full flex flex-col gap-4"
            >
              {faqItems.map((item) => (
                <Accordion.Item key={item.question} value={item.question}>
                  <Accordion.Header className="flex">
                    <Accordion.Trigger className="flex flex-1 items-start justify-between py-6 font-medium text-xl md:text-2xl text-left hover:opacity-70 transition-all [&[data-state=open]>svg]:rotate-180 group cursor-pointer">
                      <span className="text-pure-black max-w-[80%]">
                        {item.question}
                      </span>
                      <div className="relative flex items-center justify-center w-6 h-6">
                        <div className="absolute w-6 h-[1.5px] bg-pure-black" />
                        <div className="absolute w-6 h-[1.5px] bg-pure-black rotate-90 transition-transform duration-300 group-data-[state=open]:rotate-0" />
                      </div>
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="overflow-hidden text-sm md:text-base text-pure-black/70 leading-relaxed max-w-[800px] data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up mb-6">
                    {item.answer}
                  </Accordion.Content>
                  <Separator className="bg-pure-black/20" />
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </div>
        </div>
      </div>
      <Footer hideMainContent />
      <Toaster />
    </>
  );
};
