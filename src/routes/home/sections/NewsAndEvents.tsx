import { ArrowRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { JSX } from "react";

const newsItems = [
    {
        id: 1,
        badge: "НОВИНА ТИЖНЯ",
        date: "Feb 19",
        title: "When an Award-Winning\nWebsite Pays for Itself\n(Twice)",
        readTime: "MIN READ",
        backgroundImage: "https://c.animaapp.com/mkvpx7lhh8vezq/img/background.png",
        link: "Дізнатися більше",
    },
    {
        id: 2,
        badge: "НОВИНА ТИЖНЯ",
        date: "Feb 19",
        title: "When an Award-Winning\nWebsite Pays for Itself\n(Twice)",
        readTime: "MIN READ",
        backgroundImage:
            "https://c.animaapp.com/mkvpx7lhh8vezq/img/background-1.png",
        link: "Дізнатися більше",
    },
    {
        id: 3,
        badge: "НОВИНА ТИЖНЯ",
        date: "Feb 19",
        title: "When an Award-Winning\nWebsite Pays for Itself\n(Twice)",
        readTime: "MIN READ",
        backgroundImage:
            "https://c.animaapp.com/mkvpx7lhh8vezq/img/background-2.png",
        link: "Дізнатися більше",
    },
    {
        id: 4,
        badge: "НОВИНА ТИЖНЯ",
        date: "Feb 19",
        title: "When an Award-Winning\nWebsite Pays for Itself\n(Twice)",
        readTime: "MIN READ",
        backgroundImage:
            "https://c.animaapp.com/mkvpx7lhh8vezq/img/background-3.png",
        link: "Дізнатися більше",
    },
];

const socialIcons = [
    {
        icon: (
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-8">
                <mask id="mask0_530_5767" style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="22" y="22" width="20" height="20">
                    <path d="M42 22H22V42H42V22Z" className="fill-pure-white" />
                </mask>
                <g mask="url(#mask0_530_5767)">
                    <path fillRule="evenodd" clipRule="evenodd" d="M27.9091 24.6364C26.1016 24.6364 24.6364 26.1016 24.6364 27.9091V36.0909C24.6364 37.8984 26.1016 39.3636 27.9091 39.3636H36.0909C37.8984 39.3636 39.3636 37.8984 39.3636 36.0909V27.9091C39.3636 26.1016 37.8984 24.6364 36.0909 24.6364H27.9091ZM23 27.9091C23 25.1979 25.1979 23 27.9091 23H36.0909C38.8021 23 41 25.1979 41 27.9091V36.0909C41 38.8021 38.8021 41 36.0909 41H27.9091C25.1979 41 23 38.8021 23 36.0909V27.9091ZM32.3936 29.5378C31.8829 29.4621 31.3613 29.5493 30.9031 29.7871C30.4448 30.0249 30.0732 30.4012 29.8411 30.8623C29.609 31.3235 29.5282 31.8461 29.6102 32.3558C29.6922 32.8655 29.9329 33.3364 30.2979 33.7015C30.663 34.0665 31.1339 34.3072 31.6436 34.3892C32.1533 34.4712 32.6759 34.3904 33.1371 34.1583C33.5983 33.9262 33.9745 33.5546 34.2123 33.0963C34.4501 32.6381 34.5373 32.1165 34.4616 31.6058C34.3843 31.0849 34.1416 30.6026 33.7692 30.2302C33.3968 29.8578 32.9145 29.6151 32.3936 29.5378ZM30.1494 28.3347C30.9132 27.9384 31.7825 27.793 32.6336 27.9192C33.5018 28.0479 34.3056 28.4525 34.9263 29.0731C35.5469 29.6938 35.9515 30.4976 36.0802 31.3658C36.2064 32.2169 36.0611 33.0862 35.6647 33.85C35.2684 34.6138 34.6414 35.2331 33.8728 35.62C33.1042 36.0068 32.2332 36.1415 31.3836 36.0048C30.5341 35.8681 29.7493 35.467 29.1409 34.8586C28.5324 34.2501 28.1313 33.4653 27.9946 32.6151 30.1494 28.3347ZM36.4984 26.6818C36.0465 26.6818 35.6802 27.0481 35.6802 27.5C35.6802 27.9519 36.0465 28.3182 36.4984 28.3182H36.5066C36.9585 28.3182 37.3248 27.9519 37.3248 27.5C37.3248 27.0481 36.9585 26.6818 36.5066 26.6818H36.4984Z" className="fill-pure-black" />
                </g>
                <mask id="path-4-inside-1_530_5767" className="fill-pure-white">
                    <path d="M0 32C0 14.3269 14.3269 0 32 0C49.6731 0 64 14.3269 64 32C64 49.6731 49.6731 64 32 64C14.3269 64 0 49.6731 0 32Z" />
                </mask>
                <path d="M32 64V63C14.8792 63 1 49.1208 1 32H0H-1C-1 50.2254 13.7746 65 32 65V64ZM64 32H63C63 49.1208 49.1208 63 32 63V64V65C50.2254 65 65 50.2254 65 32H64ZM32 0V1C49.1208 1 63 14.8792 63 32H64H65C65 13.7746 50.2254 -1 32 -1V0ZM32 0V-1C13.7746 -1 -1 13.7746 -1 32H0H1C1 14.8792 14.8792 1 32 1V0Z" className="fill-layout-bg" mask="url(#path-4-inside-1_530_5767)" />
            </svg>
        ),
        alt: "Instagram",
    },
    {
        icon: (
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-8">
                <path d="M26.1719 25.5628C26.1729 25.8228 26.1227 26.0805 26.0241 26.3211C25.9255 26.5617 25.7805 26.7805 25.5973 26.9651C25.4142 27.1497 25.1965 27.2963 24.9566 27.3968C24.7168 27.4972 24.4595 27.5494 24.1995 27.5504C23.9395 27.5494 23.6822 27.4972 23.4424 27.3968C23.2025 27.2963 22.9848 27.1497 22.8017 26.9651C22.6185 26.7805 22.4735 26.5617 22.3749 26.3211C22.2763 26.0805 22.2261 25.8228 22.2271 25.5628C22.2251 25.0377 22.4316 24.5334 22.8013 24.1605C23.1709 23.7876 23.6735 23.5767 24.1986 23.5742C24.4588 23.5751 24.7163 23.6272 24.9563 23.7276C25.1964 23.8281 25.4143 23.9748 25.5977 24.1595C25.781 24.3441 25.9262 24.5631 26.0249 24.8039C26.1236 25.0447 26.1729 25.3026 26.1719 25.5628ZM26.1871 29.1409H22.2109V41.8647H26.1871V29.1409ZM32.5347 29.1409H28.5843V41.8647H32.5357V35.1856C32.5357 31.4714 37.33 31.1685 37.33 35.1856V41.8647H41.2966V33.8085C41.2966 27.5428 34.2014 27.7704 32.5347 30.8561V29.1409Z" className="fill-pure-black" />
                <mask id="path-3-inside-1_530_5773" className="fill-pure-white">
                    <path d="M0 32C0 14.3269 14.3269 0 32 0C49.6731 0 64 14.3269 64 32C64 49.6731 49.6731 64 32 64C14.3269 64 0 49.6731 0 32Z" />
                </mask>
                <path d="M32 64V63C14.8792 63 1 49.1208 1 32H0H-1C-1 50.2254 13.7746 65 32 65V64ZM64 32H63C63 49.1208 49.1208 63 32 63V64V65C50.2254 65 65 50.2254 65 32H64ZM32 0V1C49.1208 1 63 14.8792 63 32H64H65C65 13.7746 50.2254 -1 32 -1V0ZM32 0V-1C13.7746 -1 -1 13.7746 -1 32H0H1C1 14.8792 14.8792 1 32 1V0Z" className="fill-layout-bg" mask="url(#path-3-inside-1_530_5773)" />
            </svg>
        ),
        alt: "LinkedIn",
    },
    {
        icon: (
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-8">
                <path d="M23.0439 23L29.9935 32.3765L23 40H24.574L30.6967 33.3255L35.6438 40H41L33.6594 30.0961L40.1689 23H38.5949L32.9561 29.1471L28.4001 23H23.0439ZM25.3585 24.1699H27.8192L38.685 38.8299H36.2244L25.3585 24.1699Z" className="fill-pure-black" />
                <mask id="path-3-inside-1_530_5779" className="fill-pure-white">
                    <path d="M0 32C0 14.3269 14.3269 0 32 0C49.6731 0 64 14.3269 64 32C64 49.6731 49.6731 64 32 64C14.3269 64 0 49.6731 0 32Z" />
                </mask>
                <path d="M32 64V63C14.8792 63 1 49.1208 1 32H0H-1C-1 50.2254 13.7746 65 32 65V64ZM64 32H63C63 49.1208 49.1208 63 32 63V64V65C50.2254 65 65 50.2254 65 32H64ZM32 0V1C49.1208 1 63 14.8792 63 32H64H65C65 13.7746 50.2254 -1 32 -1V0ZM32 0V-1C13.7746 -1 -1 13.7746 -1 32H0H1C1 14.8792 14.8792 1 32 1V0Z" className="fill-layout-bg" mask="url(#path-3-inside-1_530_5779)" />
            </svg>
        ),
        alt: "X (Twitter)",
    },
    {
        icon: (
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-8">
                <mask id="mask0_530_5785" style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="22" y="22" width="20" height="20">
                    <path d="M42 22H22V42H42V22Z" className="fill-pure-white" />
                </mask>
                <g mask="url(#mask0_530_5785)">
                    <path d="M41.5781 27.1856C41.4643 26.7628 41.2414 26.3773 40.9318 26.0677C40.6222 25.7581 40.2367 25.5352 39.8139 25.4214C38.2568 25 32 25 32 25C32 25 25.7432 25 24.1861 25.4214C23.7633 25.5352 23.3778 25.7581 23.0682 26.0677C22.7586 26.3773 22.5357 26.7628 22.4219 27.1856C22.1312 28.7736 21.9901 30.3853 22.0005 31.9996C21.9901 33.6139 22.1312 35.2257 22.4219 36.8137C22.5357 37.2365 22.7586 37.622 23.0682 37.9316C23.3778 38.2412 23.7633 38.464 24.1861 38.5778C25.7432 38.9992 32 38.9992 32 38.9992C32 38.9992 38.2568 38.9992 39.8139 38.5778C40.2367 38.464 40.6222 38.2412 40.9318 37.9316C41.2414 37.622 41.4643 37.2365 41.5781 36.8137C41.8688 35.2257 42.0099 33.6139 41.9995 31.9996C42.0099 30.3853 41.8688 28.7736 41.5781 27.1856ZM30.0001 34.9995V28.9998L35.1927 31.9996L30.0001 34.9995Z" className="fill-pure-black" />
                </g>
                <mask id="path-4-inside-1_530_5785" className="fill-pure-white">
                    <path d="M0 32C0 14.3269 14.3269 0 32 0C49.6731 0 64 14.3269 64 32C64 49.6731 49.6731 64 32 64C14.3269 64 0 49.6731 0 32Z" />
                </mask>
                <path d="M32 64V63C14.8792 63 1 49.1208 1 32H0H-1C-1 50.2254 13.7746 65 32 65V64ZM64 32H63C63 49.1208 49.1208 63 32 63V64V65C50.2254 65 65 50.2254 65 32H64ZM32 0V1C49.1208 1 63 14.8792 63 32H64H65C65 13.7746 50.2254 -1 32 -1V0ZM32 0V-1C13.7746 -1 -1 13.7746 -1 32H0H1C1 14.8792 14.8792 1 32 1V0Z" className="fill-layout-bg" mask="url(#path-4-inside-1_530_5785)" />
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

export const NewsAndEvents = (): JSX.Element => {
    return (
        <section className="w-full bg-pure-white">
            {/* News Section */}
            <div className="w-full flex items-center justify-center px-0 py-20">
                <div className="flex flex-col max-w-[1440px] w-full items-start px-9">
                    <header className="flex flex-col items-start w-full mb-10 translate-y-[-1rem] animate-fade-in opacity-0">
                        <h2 className="w-full text-center [font-family:'Atyp_Display-Medium',Helvetica] font-medium text-pure-black text-[80px] tracking-[0] leading-[80px]">
                            Новини та події
                        </h2>
                    </header>

                    <div className="flex flex-col w-full items-end pt-10 pb-0 px-0 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
                        <Separator className="w-full bg-news-gray" />
                    </div>

                    <div className="grid grid-cols-4 gap-5 pt-20 w-full">
                        {newsItems.map((item, index) => (
                            <Card
                                key={item.id}
                                className="group cursor-pointer border-0 shadow-none bg-transparent hover:shadow-lg transition-shadow duration-300 translate-y-[-1rem] animate-fade-in opacity-0"
                                style={
                                    {
                                        "--animation-delay": `${400 + index * 100}ms`,
                                    } as React.CSSProperties
                                }
                            >
                                <CardContent className="p-0 flex flex-col h-full">
                                    <div
                                        className="w-full h-[198px] rounded-lg bg-cover bg-center bg-no-repeat"
                                        style={{ backgroundImage: `url(${item.backgroundImage})` }}
                                    />

                                    <div className="flex flex-col items-start justify-center pt-[22px] pb-0 px-0 flex-1">
                                        <div className="flex flex-col items-start gap-6 w-full">
                                            <div className="flex items-center justify-between w-full">
                                                <Badge
                                                    variant="outline"
                                                    className="h-7 px-[18px] py-2 rounded-full border-leadership-link text-leadership-link [font-family:'Atyp_Display-Regular',Helvetica] font-normal text-xs tracking-[0] leading-[10px]"
                                                >
                                                    {item.badge}
                                                </Badge>

                                                <time className="[font-family:'Atyp_Display-Light',Helvetica] font-light text-pure-black text-sm text-right tracking-[0] leading-[18px]">
                                                    {item.date}
                                                </time>
                                            </div>

                                            <div className="flex flex-col items-start gap-[15px] w-full">
                                                <h3 className="[font-family:'Atyp_Display-Medium',Helvetica] font-medium text-pure-black text-xl tracking-[0] leading-7 whitespace-pre-line">
                                                    {item.title}
                                                </h3>

                                                <p className="[font-family:'Atyp_Display-Regular',Helvetica] font-normal text-news-gray text-xs tracking-[0] leading-[10px]">
                                                    {item.readTime}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col w-full items-start pt-10 pb-0 px-0">
                                        <div className="flex flex-col w-full items-start gap-[3px]">
                                            <div className="flex items-center justify-between w-full group-hover:translate-x-1 transition-transform duration-300">
                                                <span className="[font-family:'Atyp_Text-Regular',Helvetica] font-normal text-pure-black text-xs tracking-[0] leading-4">
                                                    {item.link}
                                                </span>

                                                <ArrowRightIcon className="w-[19px] h-3" />
                                            </div>

                                            <Separator className="w-full bg-pure-black" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* Navigation Footer */}
            <div className="w-full bg-pure-white">
                <div className="flex flex-col items-start gap-10 px-0 py-20 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
                    <Separator className="w-full bg-layout-bg" />

                    <div className="flex flex-col max-w-[1440px] mx-auto w-full items-start px-9">
                        <nav className="flex items-start justify-between w-full">
                            <div className="flex items-start gap-6">
                                {socialIcons.map((item, index) => (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        size="icon"
                                        className="w-15 h-15 rounded-full border-layout-bg hover:bg-layout-bg hover:border-layout-bg transition-colors [&>svg]:w-full [&>svg]:h-full"
                                    >
                                        {item.icon}
                                    </Button>
                                ))}
                            </div>

                            <div className="flex flex-col w-[300px] items-start gap-4">
                                {navigationItems.map((item, index) => (
                                    <button
                                        key={index}
                                        className="flex max-w-[310px] items-center w-full group cursor-pointer"
                                    >
                                        <div className="flex flex-col items-start flex-1">
                                            <div className="flex items-start w-full">
                                                <span
                                                    className={`[font-family:'Atyp_Display-Medium',Helvetica] font-medium text-[8px] tracking-[0] leading-[14px] whitespace-nowrap ${item.isActive ? "text-leadership-link" : "text-pure-black"
                                                        } group-hover:text-leadership-link transition-colors`}
                                                >
                                                    {item.label}
                                                </span>
                                                <div className="w-[9.69px] h-2.5 ml-auto mr-[-0.69px] overflow-hidden">
                                                    <div className="relative top-0.5 left-2.5 w-[5px] h-[5px] bg-leadership-link" />
                                                </div>
                                            </div>
                                            <Separator className="w-full bg-pure-black" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </nav>
                    </div>
                </div>
            </div>
        </section>
    );
};