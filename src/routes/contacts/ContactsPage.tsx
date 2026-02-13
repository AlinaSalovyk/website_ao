import type { JSX } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Footer } from "@/components/layout/Footer";
import { Separator } from "@/components/ui/separator";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqItems = [
    {
        question: "Які освітні програми доступні в Інституті ІТ та бізнесу?",
        answer: "Інститут пропонує бакалаврські та магістерські програми в галузях інформаційних технологій, бізнес-аналітики, фінансів, менеджменту та маркетингу."
    },
    {
        question: "Які документи потрібні для вступу?",
        answer: "Для вступу необхідні сертифікати НМТ (для бакалаврів), диплом бакалавра та ЄВІ/ЄФВВ (для магістратури), паспорт, ідентифікаційний код та інші документи згідно з вимогами приймальної комісії."
    },
    {
        question: "Чи є можливість навчання за кордоном?",
        answer: "Так! Ми співпрацюємо з міжнародними університетами та пропонуємо студентам програми обміну та стажування за кордоном."
    },
    {
        question: "Чи передбачена дуальна освіта або стажування у компаніях?",
        answer: "Так, ми активно співпрацюємо з провідними ІТ-компаніями, банками та бізнес-організаціями, надаючи студентам можливість проходити стажування та працювати над реальними кейсами."
    }
];

export const ContactsPage = (): JSX.Element => {
    return (
        <MainLayout
            variant="light"
            customLogo={
                <img
                    src="/images/Contacts/LogoContacts.png"
                    alt="Logo"
                    className="h-8 md:h-10 w-auto"
                />
            }
        >
            <div className="w-full bg-pure-white flex flex-col items-center">
                <div className="w-full max-w-7xl 2xl:max-w-screen-2xl px-4 md:px-9 flex flex-col pt-10 pb-20 gap-16 md:gap-24">

                    {/* Hero Section */}
                    <div className="flex flex-col gap-6 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
                        <div className="flex flex-col gap-8 md:flex-row md:justify-between md:items-start">
                            <h1 className="font-['Atyp_Display-Medium',Helvetica] font-medium text-4xl md:text-6xl lg:text-[80px] leading-[1.1] tracking-tight text-pure-black max-w-4xl text-left">
                                Час приєднатися до <br className="hidden md:block" />
                                інституту ІТ та Бізнесу
                            </h1>
                        </div>

                        <p className="font-['Atyp_Display-Medium',Helvetica] text-xl md:text-2xl text-pure-black/80">
                            Створюй власне майбутнє разом з нами!
                        </p>
                        <Separator className="bg-pure-black/20" />
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">

                        {/* Left Column - Director Info */}
                        <div className="flex flex-col gap-8 md:flex-row md:gap-6 items-start">
                            {/* Line decoration similar to screenshot */}
                            <div className="hidden md:flex flex-col gap-2 pt-2">
                                <div className="w-0.5 h-6 bg-pure-black/20"></div>
                                <div className="w-0.5 h-6 bg-pure-black/20"></div>
                                <div className="w-0.5 h-6 bg-pure-black"></div>
                                <div className="w-0.5 h-6 bg-pure-black/20"></div>
                            </div>

                            <div className="w-full md:w-auto flex-shrink-0">
                                <div className="w-full md:w-[200px] h-[300px] md:h-[200px] bg-gray-200 rounded-lg overflow-hidden">
                                    <img src="/images/InstituteManagement/novoseletskyy.jpg" alt="Новоселецький Олександр Миколайович" className="w-full h-full object-cover object-top" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 max-w-sm">
                                <h3 className="font-['Atyp_Display-Medium',Helvetica] font-medium text-xl text-pure-black">
                                    Новоселецький Олександр Миколайович
                                </h3>
                                <p className="font-['Roboto',sans-serif] text-sm text-pure-black/70 leading-relaxed">
                                    Директор інституту ІТ та Бізнесу, кандидат економічних наук, доцент кафедри інформаційних технологій та аналітики даних
                                </p>

                                <div className="flex flex-col gap-1 mt-4 font-['Roboto',sans-serif] text-[10px] md:text-xs">
                                    <p className="font-medium text-pure-black">Контактна інформація:</p>
                                    <p className="text-pure-black/70">e-mail: aleksandr.novoseletskyiy@oa.edu.ua</p>
                                </div>

                                <div className="flex flex-col gap-1 font-['Roboto',sans-serif] text-[10px] md:text-xs">
                                    <p className="font-medium text-pure-black">Офісні години:</p>
                                    <p className="text-pure-black/70">понеділок - п'ятниця: 8.30-17.30, обідня перерва: 12.30-13.30</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Contact Form */}
                        <div className="flex flex-col gap-8 w-full font-['Roboto',sans-serif]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] uppercase font-bold tracking-wider text-pure-black">Ім'я</label>
                                    <input type="text" placeholder="Бен" className="border-b border-pure-black/20 pb-2 outline-none focus:border-pure-black transition-colors bg-transparent placeholder:text-black/20 text-pure-black" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] uppercase font-bold tracking-wider text-pure-black">Прізвище</label>
                                    <input type="text" placeholder="Марк" className="border-b border-pure-black/20 pb-2 outline-none focus:border-pure-black transition-colors bg-transparent placeholder:text-black/20 text-pure-black" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase font-bold tracking-wider text-pure-black">Email</label>
                                <input type="email" placeholder="ben@gmail.com" className="border-b border-pure-black/20 pb-2 outline-none focus:border-pure-black transition-colors bg-transparent placeholder:text-black/20 text-pure-black" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase font-bold tracking-wider text-pure-black">Область</label>
                                <input type="text" placeholder="Вибери одну.." className="border-b border-pure-black/20 pb-2 outline-none focus:border-pure-black transition-colors bg-transparent placeholder:text-black/20 text-pure-black" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase font-bold tracking-wider text-pure-black">Повідомлення</label>
                                <textarea placeholder="Розкажи нам більше, або постав питання" rows={1} className="border-b border-pure-black/20 pb-2 outline-none focus:border-pure-black transition-colors bg-transparent resize-none placeholder:text-black/20 min-h-[30px] text-pure-black"></textarea>
                            </div>

                            <div className="w-fit flex gap-4 items-center border-b border-pure-black pb-1 mt-4 cursor-pointer hover:opacity-70 transition-opacity group">
                                <span className="text-xs font-medium text-pure-black">Надіслати повідомлення</span>
                                <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform group-hover:translate-x-1 transition-transform">
                                    <path d="M12.5 1L17 6M17 6L12.5 11M17 6H0" stroke="black" strokeWidth="1" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="w-full md:w-1/2 md:max-w-[48%] self-start flex flex-col gap-8 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:800ms]">
                        <Accordion.Root type="multiple" className="w-full flex flex-col gap-4">
                            {faqItems.map((item, index) => (
                                <Accordion.Item key={index} value={`item-${index}`} className="border-b border-pure-black/0">
                                    <Accordion.Header className="flex">
                                        <Accordion.Trigger className="flex flex-1 items-start justify-between py-6 font-['Atyp_Display-Medium',Helvetica] font-medium text-xl md:text-2xl text-left hover:opacity-70 transition-all [&[data-state=open]>svg]:rotate-180 group">
                                            <span className="text-pure-black max-w-[80%]">{item.question}</span>
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
            <Footer hideMainContent={true} />
        </MainLayout>
    );
};
