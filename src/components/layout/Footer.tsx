import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { JSX } from "react";

export const Footer = (): JSX.Element => {
    return (
        <section className="flex flex-col w-full items-start relative bg-pure-white flex-1">
            <div className="flex flex-col w-full items-center justify-center px-0 py-8 bg-layout-bg relative flex-1">
                <img
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    alt="Background"
                    src="/images/Backgroundfooter.png"
                />

                <div className="flex flex-col max-w-[1440px] w-full items-start justify-center px-9 py-0 relative flex-1">
                    <div className="flex flex-col items-start justify-between flex-1 w-full">
                        <div className="flex items-start justify-between flex-1 w-full gap-6 mb-9 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
                            <Card className="w-[413px] bg-footer-card-deep border-none rounded-lg hover:scale-105 transition-transform">
                                <CardContent className="flex flex-col items-start gap-[247.48px] p-6">
                                    <div className="flex flex-col items-start gap-6 w-full">
                                        <div className="flex items-center justify-between w-full">
                                            <span className="[font-family:'Atyp_Display-Regular',Helvetica] font-normal text-xs leading-[14px] text-pure-white tracking-[0]">
                                                ПРО ІНСТИТУТ
                                            </span>
                                            <svg width="13" height="16" viewBox="0 0 13 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12.3536 10.3539C12.5488 10.1586 12.5488 9.84205 12.3536 9.64679L9.17157 6.46481C8.97631 6.26954 8.65973 6.26954 8.46447 6.46481C8.2692 6.66007 8.2692 6.97665 8.46447 7.17191L11.2929 10.0003L8.46447 12.8288C8.2692 13.024 8.2692 13.3406 8.46447 13.5359C8.65973 13.7311 8.97631 13.7311 9.17157 13.5359L12.3536 10.3539ZM0 10.5003H12V9.50034H0V10.5003Z" className="fill-pure-white" />
                                            </svg>
                                        </div>

                                        <h2 className="[font-family:'Atyp_Display-Medium',Helvetica] font-medium text-[32px] leading-[38px] text-pure-white tracking-[0]">
                                            Розвиток та <br />
                                            Інновації в ІТ та Бізнесі
                                        </h2>
                                    </div>

                                    <p className="[font-family:'Atyp_Text-Regular',Helvetica] font-normal text-pure-white text-xs tracking-[0] leading-[18px]">
                                        Бізнес й аналітика, Комп&apos;ютерні науки, <br />
                                        Фінанси та банківська справа, Маркетинг,
                                        <br />
                                        Менеджмент, Прикладна математика
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="flex-1 bg-footer-card-bright border-none rounded-lg overflow-hidden hover:scale-105 transition-transform">
                                <CardContent className="flex flex-col items-start gap-[220px] p-6">
                                    <div className="flex flex-col items-start gap-6 w-full">
                                        <div className="flex items-center justify-between w-full">
                                            <span className="[font-family:'Atyp_Display-Regular',Helvetica] font-normal text-xs leading-[14px] text-pure-white tracking-[0]">
                                                ДАВАЙ ТРИМАТИ КОНТАКТ
                                            </span>
                                            <svg width="13" height="16" viewBox="0 0 13 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12.3536 10.3539C12.5488 10.1586 12.5488 9.84205 12.3536 9.64679L9.17157 6.46481C8.97631 6.26954 8.65973 6.26954 8.46447 6.46481C8.2692 6.66007 8.2692 6.97665 8.46447 7.17191L11.2929 10.0003L8.46447 12.8288C8.2692 13.024 8.2692 13.3406 8.46447 13.5359C8.65973 13.7311 8.97631 13.7311 9.17157 13.5359L12.3536 10.3539ZM0 10.5003H12V9.50034H0V10.5003Z" className="fill-pure-white" />
                                            </svg>
                                        </div>

                                        <h2 className="[font-family:'Atyp_Display-Medium',Helvetica] font-medium text-[32px] leading-[38px] text-pure-white tracking-[0]">
                                            Нумо змінювати світ <br />
                                            разом з нами!
                                        </h2>
                                    </div>

                                    <div className="flex items-end gap-[172px] w-full">
                                        <div className="inline-flex flex-col items-start justify-end">
                                            <h3 className="[font-family:'Atyp_Display-Semibold',Helvetica] font-normal text-pure-white text-7xl tracking-[0] leading-[80px] whitespace-nowrap">
                                                Start Studying
                                            </h3>
                                        </div>

                                        <div className="inline-flex flex-col min-w-[180px] items-start">
                                            <div className="flex flex-col w-[229px] items-start gap-[3px]">
                                                <button className="flex items-center justify-between w-full group cursor-pointer">
                                                    <div className="relative w-[181px] h-4">
                                                        <span className="h-4 flex items-center justify-center text-pure-white text-xs leading-4 whitespace-nowrap [font-family:'Atyp_Text-Regular',Helvetica] font-normal tracking-[0] group-hover:opacity-80 transition-opacity">
                                                            Контактуй з нами
                                                        </span>
                                                    </div>
                                                    <svg width="13" height="16" viewBox="0 0 13 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M12.3536 10.3539C12.5488 10.1586 12.5488 9.84205 12.3536 9.64679L9.17157 6.46481C8.97631 6.26954 8.65973 6.26954 8.46447 6.46481C8.2692 6.66007 8.2692 6.97665 8.46447 7.17191L11.2929 10.0003L8.46447 12.8288C8.2692 13.024 8.2692 13.3406 8.46447 13.5359C8.65973 13.7311 8.97631 13.7311 9.17157 13.5359L12.3536 10.3539ZM0 10.5003H12V9.50034H0V10.5003Z" className="fill-pure-white" />
                                                    </svg>
                                                </button>
                                                <Separator className="w-[229px] bg-pure-white" />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <footer className="flex flex-col items-start pt-9 w-full bg-transparent translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
                            <div className="flex items-center gap-8 w-full flex-wrap">
                                <button className="[font-family:'Atyp_Text-Medium',Helvetica] font-medium text-pure-white text-xs tracking-[0] leading-[18px] whitespace-nowrap hover:opacity-80 transition-opacity">
                                    Cookie Preference
                                </button>

                                <span className="[font-family:'Atyp_Text-Medium',Helvetica] font-medium text-pure-white text-xs tracking-[0] leading-[18px] whitespace-nowrap">
                                    Національний університет &quot;Острозька академія&quot;
                                </span>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>
        </section>
    );
};