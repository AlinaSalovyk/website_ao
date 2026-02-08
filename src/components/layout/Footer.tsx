import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { JSX } from "react";

const socialIcons = [
    {
        icon: (
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-15">
                <mask id="mask0_530_5767" style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="22" y="22" width="20" height="20">
                    <path d="M42 22H22V42H42V22Z" className="fill-pure-white" />
                </mask>
                <g mask="url(#mask0_530_5767)">
                    <path fillRule="evenodd" clipRule="evenodd" d="M27.9091 24.6364C26.1016 24.6364 24.6364 26.1016 24.6364 27.9091V36.0909C24.6364 37.8984 26.1016 39.3636 27.9091 39.3636H36.0909C37.8984 39.3636 39.3636 37.8984 39.3636 36.0909V27.9091C39.3636 26.1016 37.8984 24.6364 36.0909 24.6364H27.9091ZM23 27.9091C23 25.1979 25.1979 23 27.9091 23H36.0909C38.8021 23 41 25.1979 41 27.9091V36.0909C41 38.8021 38.8021 41 36.0909 41H27.9091C25.1979 41 23 38.8021 23 36.0909V27.9091ZM32.3936 29.5378C31.8829 29.4621 31.3613 29.5493 30.9031 29.7871C30.4448 30.0249 30.0732 30.4012 29.8411 30.8623C29.609 31.3235 29.5282 31.8461 29.6102 32.3558C29.6922 32.8655 29.9329 33.3364 30.2979 33.7015C30.663 34.0665 31.1339 34.3072 31.6436 34.3892C32.1533 34.4712 32.6759 34.3904 33.1371 34.1583C33.5983 33.9262 33.9745 33.5546 34.2123 33.0963C34.4501 32.6381 34.5373 32.1165 34.4616 31.6058C34.3843 31.0849 34.1416 30.6026 33.7692 30.2302C33.3968 29.8578 32.9145 29.6151 32.3936 29.5378ZM30.1494 28.3347C30.9132 27.9384 31.7825 27.793 32.6336 27.9192C33.5018 28.0479 34.3056 28.4525 34.9263 29.0731C35.5469 29.6938 35.9515 30.4976 36.0802 31.3658C36.2064 32.2169 36.0611 33.0862 35.6647 33.85C35.2684 34.6138 34.6414 35.2331 33.8728 35.62C33.1042 36.0068 32.2332 36.1415 31.3836 36.0048C30.5341 35.8681 29.7493 35.467 29.1409 34.8586C28.5324 34.2501 28.1313 33.4653 27.9946 32.6151 30.1494 28.3347ZM36.4984 26.6818C36.0465 26.6818 35.6802 27.0481 35.6802 27.5C35.6802 27.9519 36.0465 28.3182 36.4984 28.3182H36.5066C36.9585 28.3182 37.3248 27.9519 37.3248 27.5C37.3248 27.0481 36.9585 26.6818 36.5066 26.6818H36.4984Z" className="fill-pure-white" />
                </g>
                <mask id="path-4-inside-1_530_5767" className="fill-pure-white">
                    <path d="M0 32C0 14.3269 14.3269 0 32 0C49.6731 0 64 14.3269 64 32C64 49.6731 49.6731 64 32 64C14.3269 64 0 49.6731 0 32Z" />
                </mask>
                <path d="M32 64V63C14.8792 63 1 49.1208 1 32H0H-1C-1 50.2254 13.7746 65 32 65V64ZM64 32H63C63 49.1208 49.1208 63 32 63V64V65C50.2254 65 65 50.2254 65 32H64ZM32 0V1C49.1208 1 63 14.8792 63 32H64H65C65 13.7746 50.2254 -1 32 -1V0ZM32 0V-1C13.7746 -1 -1 13.7746 -1 32H0H1C1 14.8792 14.8792 1 32 1V0Z" className="fill-layout-bg/20" mask="url(#path-4-inside-1_530_5767)" />
            </svg>
        ),
        alt: "Instagram",
    },
    {
        icon: (
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-15">
                <path d="M26.1719 25.5628C26.1729 25.8228 26.1227 26.0805 26.0241 26.3211C25.9255 26.5617 25.7805 26.7805 25.5973 26.9651C25.4142 27.1497 25.1965 27.2963 24.9566 27.3968C24.7168 27.4972 24.4595 27.5494 24.1995 27.5504C23.9395 27.5494 23.6822 27.4972 23.4424 27.3968C23.2025 27.2963 22.9848 27.1497 22.8017 26.9651C22.6185 26.7805 22.4735 26.5617 22.3749 26.3211C22.2763 26.0805 22.2261 25.8228 22.2271 25.5628C22.2251 25.0377 22.4316 24.5334 22.8013 24.1605C23.1709 23.7876 23.6735 23.5767 24.1986 23.5742C24.4588 23.5751 24.7163 23.6272 24.9563 23.7276C25.1964 23.8281 25.4143 23.9748 25.5977 24.1595C25.781 24.3441 25.9262 24.5631 26.0249 24.8039C26.1236 25.0447 26.1729 25.3026 26.1719 25.5628ZM26.1871 29.1409H22.2109V41.8647H26.1871V29.1409ZM32.5347 29.1409H28.5843V41.8647H32.5357V35.1856C32.5357 31.4714 37.33 31.1685 37.33 35.1856V41.8647H41.2966V33.8085C41.2966 27.5428 34.2014 27.7704 32.5347 30.8561V29.1409Z" className="fill-pure-white" />
                <mask id="path-3-inside-1_530_5773" className="fill-pure-white">
                    <path d="M0 32C0 14.3269 14.3269 0 32 0C49.6731 0 64 14.3269 64 32C64 49.6731 49.6731 64 32 64C14.3269 64 0 49.6731 0 32Z" />
                </mask>
                <path d="M32 64V63C14.8792 63 1 49.1208 1 32H0H-1C-1 50.2254 13.7746 65 32 65V64ZM64 32H63C63 49.1208 49.1208 63 32 63V64V65C50.2254 65 65 50.2254 65 32H64ZM32 0V1C49.1208 1 63 14.8792 63 32H64H65C65 13.7746 50.2254 -1 32 -1V0ZM32 0V-1C13.7746 -1 -1 13.7746 -1 32H0H1C1 14.8792 14.8792 1 32 1V0Z" className="fill-layout-bg/20" mask="url(#path-3-inside-1_530_5773)" />
            </svg>
        ),
        alt: "LinkedIn",
    },
    {
        icon: (
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-15">
                <path d="M23.0439 23L29.9935 32.3765L23 40H24.574L30.6967 33.3255L35.6438 40H41L33.6594 30.0961L40.1689 23H38.5949L32.9561 29.1471L28.4001 23H23.0439ZM25.3585 24.1699H27.8192L38.685 38.8299H36.2244L25.3585 24.1699Z" className="fill-pure-white" />
                <mask id="path-3-inside-1_530_5779" className="fill-pure-white">
                    <path d="M0 32C0 14.3269 14.3269 0 32 0C49.6731 0 64 14.3269 64 32C64 49.6731 49.6731 64 32 64C14.3269 64 0 49.6731 0 32Z" />
                </mask>
                <path d="M32 64V63C14.8792 63 1 49.1208 1 32H0H-1C-1 50.2254 13.7746 65 32 65V64ZM64 32H63C63 49.1208 49.1208 63 32 63V64V65C50.2254 65 65 50.2254 65 32H64ZM32 0V1C49.1208 1 63 14.8792 63 32H64H65C65 13.7746 50.2254 -1 32 -1V0ZM32 0V-1C13.7746 -1 -1 13.7746 -1 32H0H1C1 14.8792 14.8792 1 32 1V0Z" className="fill-layout-bg/20" mask="url(#path-3-inside-1_530_5779)" />
            </svg>
        ),
        alt: "X (Twitter)",
    },
    {
        icon: (
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-15">
                <mask id="mask0_530_5785" style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="22" y="22" width="20" height="20">
                    <path d="M42 22H22V42H42V22Z" className="fill-pure-white" />
                </mask>
                <g mask="url(#mask0_530_5785)">
                    <path d="M41.5781 27.1856C41.4643 26.7628 41.2414 26.3773 40.9318 26.0677C40.6222 25.7581 40.2367 25.5352 39.8139 25.4214C38.2568 25 32 25 32 25C32 25 25.7432 25 24.1861 25.4214C23.7633 25.5352 23.3778 25.7581 23.0682 26.0677C22.7586 26.3773 22.5357 26.7628 22.4219 27.1856C22.1312 28.7736 21.9901 30.3853 22.0005 31.9996C21.9901 33.6139 22.1312 35.2257 22.4219 36.8137C22.5357 37.2365 22.7586 37.622 23.0682 37.9316C23.3778 38.2412 23.7633 38.464 24.1861 38.5778C25.7432 38.9992 32 38.9992 32 38.9992C32 38.9992 38.2568 38.9992 39.8139 38.5778C40.2367 38.464 40.6222 38.2412 40.9318 37.9316C41.2414 37.622 41.4643 37.2365 41.5781 36.8137C41.8688 35.2257 42.0099 33.6139 41.9995 31.9996C42.0099 30.3853 41.8688 28.7736 41.5781 27.1856ZM30.0001 34.9995V28.9998L35.1927 31.9996L30.0001 34.9995Z" className="fill-pure-white" />
                </g>
                <mask id="path-4-inside-1_530_5785" className="fill-pure-white">
                    <path d="M0 32C0 14.3269 14.3269 0 32 0C49.6731 0 64 14.3269 64 32C64 49.6731 49.6731 64 32 64C14.3269 64 0 49.6731 0 32Z" />
                </mask>
                <path d="M32 64V63C14.8792 63 1 49.1208 1 32H0H-1C-1 50.2254 13.7746 65 32 65V64ZM64 32H63C63 49.1208 49.1208 63 32 63V64V65C50.2254 65 65 50.2254 65 32H64ZM32 0V1C49.1208 1 63 14.8792 63 32H64H65C65 13.7746 50.2254 -1 32 -1V0ZM32 0V-1C13.7746 -1 -1 13.7746 -1 32H0H1C1 14.8792 14.8792 1 32 1V0Z" className="fill-layout-bg/20" mask="url(#path-4-inside-1_530_5785)" />
            </svg>
        ),
        alt: "YouTube",
    },
];

const navigationItems = [
    { label: "ГОЛОВНА", isActive: true },
    { label: "ПРО ІНСТИТУТ", isActive: false },
    { label: "ОСВІТНІ ПРОГРАМИ", isActive: false },
    { label: "НОВИНИ ТА ПОДІЇ", isActive: false },
];

export const Footer = (): JSX.Element => {
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
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start w-full gap-4 sm:gap-8 mb-6 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
                            <button className="[font-family:'Atyp_Text-Medium',Helvetica] font-medium text-pure-white text-xs tracking-[0] leading-[18px] whitespace-nowrap hover:opacity-80 transition-opacity cursor-pointer">
                                Cookie Preference
                            </button>

                            <span className="[font-family:'Atyp_Text-Medium',Helvetica] font-medium text-pure-white text-xs tracking-[0] leading-[18px] whitespace-normal sm:whitespace-nowrap">
                                Національний університет &quot;Острозька академія&quot;
                            </span>
                        </div>

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

                        <div className="flex flex-row items-center justify-between w-full mt-6 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:800ms]">
                            <div className="flex flex-row items-center gap-8">
                                <button className="font-medium text-pure-white text-xs tracking-[0] leading-[18px] whitespace-nowrap transition-opacity cursor-pointer">
                                    Cookie Preference
                                </button>

                                <span className="font-medium text-pure-white text-xs tracking-[0] leading-[18px] whitespace-nowrap">
                                    Національний університет &quot;Острозька академія&quot;
                                </span>
                            </div>

                            <div className="flex flex-row items-center gap-4">
                                {socialIcons.map((icon, index) => (
                                    <a
                                        key={index}
                                        href="#"
                                        className="transition-opacity hover:opacity-80"
                                        aria-label={icon.alt}
                                    >
                                        {icon.icon}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};