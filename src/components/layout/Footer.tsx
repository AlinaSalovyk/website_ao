import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSocialIcons } from "@/components/icons/SocialIcons";
import type { JSX } from "react";

const navigationItems = [
    { label: "ГОЛОВНА", isActive: true },
    { label: "ПРО ІНСТИТУТ", isActive: false },
    { label: "ОСВІТНІ ПРОГРАМИ", isActive: false },
    { label: "НОВИНИ ТА ПОДІЇ", isActive: false },
];

export const Footer = (): JSX.Element => {
    const footerSocials = getSocialIcons("fill-pure-black", "fill-transparent", "size-full");

    return (
        <section className="flex flex-col w-full items-start relative bg-pure-white flex-1">
            <div className="flex flex-col w-full items-center justify-center py-8 bg-layout-bg relative flex-1">
                <img
                    className="absolute top-0 left-0 w-full h-full object-cover object-top"
                    alt="Background"
                    src="/images/Backgroundfooter.png"
                />

                <div className="flex flex-col max-w-7xl 2xl:max-w-screen-2xl w-full items-start justify-center px-4 md:px-9 py-0 relative flex-1">
                    <div className="flex flex-col items-start justify-between flex-1 w-full">
                        <div className="flex flex-col lg:flex-row items-stretch justify-between flex-1 w-full gap-4 mt-4 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
                            <Card className="w-full lg:w-[413px] bg-footer-card-deep border-none rounded-lg hover:scale-[1.02] transition-transform duration-300">
                                <CardContent className="flex flex-col items-start justify-between h-full gap-16 sm:gap-[247.48px] p-6">
                                    <div className="flex flex-col items-start gap-6 w-full">
                                        <div className="flex items-center justify-between w-full">
                                            <span className="font-normal text-xs leading-[14px] text-pure-white tracking-[0]">
                                                ПРО ІНСТИТУТ
                                            </span>
                                            <svg width="13" height="16" viewBox="0 0 13 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12.3536 10.3539C12.5488 10.1586 12.5488 9.84205 12.3536 9.64679L9.17157 6.46481C8.97631 6.26954 8.65973 6.26954 8.46447 6.46481C8.2692 6.66007 8.2692 6.97665 8.46447 7.17191L11.2929 10.0003L8.46447 12.8288C8.2692 13.024 8.2692 13.3406 8.46447 13.5359C8.65973 13.7311 8.97631 13.7311 9.17157 13.5359L12.3536 10.3539ZM0 10.5003H12V9.50034H0V10.5003Z" className="fill-pure-white" />
                                            </svg>
                                        </div>

                                        <h2 className="[font-family:'Atyp_Display-Medium',Helvetica] font-medium text-2xl sm:text-[32px] sm:leading-[38px] text-pure-white tracking-[0]">
                                            Розвиток та <br />
                                            Інновації в ІТ та Бізнесі
                                        </h2>
                                    </div>

                                    <p className="font-normal text-pure-white text-xs tracking-[0] leading-[18px]">
                                        Бізнес й аналітика, Комп&apos;ютерні науки, <br />
                                        Фінанси та банківська справа, Маркетинг,
                                        <br />
                                        Менеджмент, Прикладна математика
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="flex-1 bg-footer-card-deep border-none rounded-lg overflow-hidden hover:scale-[1.02] transition-transform duration-300">
                                <CardContent className="flex flex-col items-start justify-between h-full gap-16 sm:gap-[220px] p-6">
                                    <div className="flex flex-col items-start gap-6 w-full">
                                        <div className="flex items-center justify-between w-full">
                                            <span className="font-normal text-xs leading-[14px] text-pure-white tracking-[0]">
                                                ДАВАЙ ТРИМАТИ КОНТАКТ
                                            </span>
                                            <svg width="13" height="16" viewBox="0 0 13 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12.3536 10.3539C12.5488 10.1586 12.5488 9.84205 12.3536 9.64679L9.17157 6.46481C8.97631 6.26954 8.65973 6.26954 8.46447 6.46481C8.2692 6.66007 8.2692 6.97665 8.46447 7.17191L11.2929 10.0003L8.46447 12.8288C8.2692 13.024 8.2692 13.3406 8.46447 13.5359C8.65973 13.7311 8.97631 13.7311 9.17157 13.5359L12.3536 10.3539ZM0 10.5003H12V9.50034H0V10.5003Z" className="fill-pure-white" />
                                            </svg>
                                        </div>

                                        <h2 className="[font-family:'Atyp_Display-Medium',Helvetica] font-medium text-2xl sm:text-[32px] sm:leading-[38px] text-pure-white tracking-[0]">
                                            Нумо змінювати світ <br />
                                            разом з нами!
                                        </h2>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-start md:items-end gap-8 md:gap-4 lg:gap-[172px] w-full justify-between">
                                        <div className="inline-flex flex-col items-start justify-end">
                                            <h3 className="[font-family:'Atyp_Display-Semibold',Helvetica] font-normal text-pure-white text-5xl sm:text-7xl tracking-[0] leading-none sm:leading-[80px] whitespace-nowrap">
                                                Start Studying
                                            </h3>
                                        </div>

                                        <div className="inline-flex flex-col w-full md:w-auto md:min-w-[180px] items-start">
                                            <div className="flex flex-col w-full md:w-[229px] items-start gap-[3px]">
                                                <button className="flex items-center justify-between w-full group cursor-pointer">
                                                    <div className="relative w-full md:w-[181px] h-4">
                                                        <span className="h-4 flex items-center justify-start md:justify-center text-pure-white text-xs leading-4 whitespace-nowrap [font-family:'Atyp_Text-Regular',Helvetica] font-normal tracking-[0] group-hover:opacity-80 transition-opacity">
                                                            Контактуй з нами
                                                        </span>
                                                    </div>
                                                    <svg width="13" height="16" viewBox="0 0 13 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M12.3536 10.3539C12.5488 10.1586 12.5488 9.84205 12.3536 9.64679L9.17157 6.46481C8.97631 6.26954 8.65973 6.26954 8.46447 6.46481C8.2692 6.66007 8.2692 6.97665 8.46447 7.17191L11.2929 10.0003L8.46447 12.8288C8.2692 13.024 8.2692 13.3406 8.46447 13.5359C8.65973 13.7311 8.97631 13.7311 9.17157 13.5359L12.3536 10.3539ZM0 10.5003H12V9.50034H0V10.5003Z" className="fill-pure-white" />
                                                    </svg>
                                                </button>
                                                <Separator className="w-full bg-pure-white" />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full bg-pure-white py-8 md:py-10 border-t border-layout-bg/10">
                <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                    {/* Left Column - Contacts */}
                    <div className="flex flex-col gap-0.5 [font-family:'Roboto',sans-serif] text-pure-black text-sm lg:text-base leading-[1.3]">
                        <a
                            href="https://www.google.com/maps/place/%D0%B2%D1%83%D0%BB.+%D0%A1%D0%B5%D0%BC%D1%96%D0%BD%D0%B0%D1%80%D1%81%D1%8C%D0%BA%D0%B0,+2,+%D0%9E%D1%81%D1%82%D1%80%D0%BE%D0%B3,+%D0%A0%D1%96%D0%B2%D0%BD%D0%B5%D0%BD%D1%81%D1%8C%D0%BA%D0%B0+%D0%BE%D0%B1%D0%BB%D0%B0%D1%81%D1%82%D1%8C,+35800/@50.3228186,26.5054707,17z/data=!3m1!4b1!4m6!3m5!1s0x472dada058296a2f:0x6b1660ca4f5d22f6!8m2!3d50.3228152!4d26.5080456!16s%2Fg%2F12hn9506l?entry=ttu"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                        >
                            <p>35800, м. Острог</p>
                            <p>вул. Семінарська, 2</p>
                        </a>
                        <a href="https://www.oa.edu.ua" className="hover:underline">www.oa.edu.ua</a>
                        <a href="mailto:press@oa.edu.ua" className="hover:underline">press@oa.edu.ua</a>
                        <p>+38 067 879 2526</p>
                    </div>

                    {/* Middle Column - Socials */}
                    <div className="flex items-center gap-4 lg:gap-6">
                        {footerSocials.map((icon, index) => (
                            <a
                                key={index}
                                href="#"
                                className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border border-pure-black flex items-center justify-center transition-all hover:bg-pure-black group"
                                aria-label={icon.alt}
                            >
                                <div className="w-9 h-9 lg:w-20 lg:h-30 group-hover:invert group-hover:brightness-0 group-hover:filter transition-all flex items-center justify-center translate-y-[1px]">
                                    {icon.icon}
                                </div>
                            </a>
                        ))}
                    </div>

                    <nav className="flex flex-col gap-3 w-full md:w-auto min-w-[140px] lg:min-w-[180px]">
                        {navigationItems.map((item, index) => (
                            <button
                                key={index}
                                className="flex flex-col w-full group cursor-pointer"
                            >
                                <div className="flex items-center justify-between w-full pb-1">
                                    <span
                                        className={`[font-family:'Roboto',sans-serif] font-medium text-[10px] lg:text-xs tracking-wider uppercase transition-colors ${item.isActive ? "text-leadership-link" : "text-pure-black"
                                            } group-hover:text-leadership-link`}
                                    >
                                        {item.label}
                                    </span>
                                    {item.isActive && (
                                        <div className="w-1.5 h-1.5 bg-leadership-link rounded-sm" />
                                    )}
                                </div>
                                <Separator className="w-full bg-pure-black/20 group-hover:bg-pure-black transition-colors" />
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="w-full bg-pure-black py-4">
                <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9 flex flex-row items-center gap-8">
                    <button className="[font-family:'Roboto',sans-serif] font-medium text-pure-white text-[10px] lg:text-xs tracking-wide hover:opacity-70 transition-opacity">
                        Cookie Preference
                    </button>
                    <span className="[font-family:'Roboto',sans-serif] font-medium text-pure-white text-[10px] lg:text-xs tracking-wide">
                        Національний університет &quot;Острозька академія&quot;
                    </span>
                </div>
            </div>
        </section >
    );
};