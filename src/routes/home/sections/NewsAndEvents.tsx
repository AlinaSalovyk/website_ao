import { ArrowRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { getSocialIcons } from "@/components/icons/SocialIcons";
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

const socialIcons = getSocialIcons("fill-pure-black", "fill-layout-bg", "size-8");

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
            <div className="w-full flex items-center justify-center px-0 py-10 md:py-20">
                <div className="flex flex-col max-w-7xl 2xl:max-w-screen-2xl w-full items-start px-4 md:px-9">
                    <header className="flex flex-col items-start w-full mb-10 translate-y-[-1rem] animate-fade-in opacity-0">
                        <h2 className="w-full text-center [font-family:'Atyp_Display-Medium',Helvetica] font-medium text-pure-black text-4xl md:text-5xl xl:text-7xl 2xl:text-[80px] tracking-[0] leading-tight xl:leading-[80px]">
                            Новини та події
                        </h2>
                    </header>

                    <div className="flex flex-col w-full items-end pt-10 pb-0 px-0 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
                        <Separator className="w-full bg-news-gray" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-10 md:pt-20 w-full">
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
                                        className="w-full h-48 sm:h-64 md:h-36 xl:h-44 2xl:h-[198px] rounded-lg bg-cover bg-center bg-no-repeat"
                                        style={{ backgroundImage: `url(${item.backgroundImage})` }}
                                    />

                                    <div className="flex flex-col items-start justify-center pt-4 xl:pt-5 2xl:pt-[22px] pb-0 px-0 flex-1">
                                        <div className="flex flex-col items-start gap-6 w-full">
                                            <div className="flex items-center justify-between w-full">
                                                <Badge
                                                    variant="outline"
                                                    className="h-7 px-3 xl:px-4 2xl:px-[18px] py-2 rounded-full border-leadership-link text-leadership-link [font-family:'Atyp_Display-Regular',Helvetica] font-normal text-xs tracking-[0] leading-[10px]"
                                                >
                                                    {item.badge}
                                                </Badge>

                                                <time className="[font-family:'Atyp_Display-Light',Helvetica] font-light text-pure-black text-sm text-right tracking-[0] leading-[18px]">
                                                    {item.date}
                                                </time>
                                            </div>

                                            <div className="flex flex-col items-start gap-3 xl:gap-4 2xl:gap-[15px] w-full">
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
                                        <div className="flex flex-col w-full items-start gap-1 2xl:gap-[3px]">
                                            <div className="flex items-center justify-between w-full group-hover:translate-x-1 transition-transform duration-300">
                                                <span className="[font-family:'Atyp_Text-Regular',Helvetica] font-normal text-pure-black text-xs tracking-[0] leading-4">
                                                    {item.link}
                                                </span>

                                                <ArrowRightIcon className="w-4 xl:w-[19px] h-3" />
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
                <div className="flex flex-col items-start gap-10 px-0 py-10 md:py-20 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
                    <Separator className="w-full bg-layout-bg" />

                    <div className="flex flex-col max-w-7xl 2xl:max-w-screen-2xl mx-auto w-full items-start px-4 md:px-9">
                        <nav className="flex flex-col md:flex-row items-center md:items-start justify-between w-full">
                            <div className="flex items-start gap-6 mb-10 md:mb-0">
                                {socialIcons.map((item, index) => (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        size="icon"
                                        className="w-12 h-12 md:w-15 md:h-15 rounded-full border-layout-bg hover:bg-layout-bg hover:border-layout-bg transition-colors [&>svg]:w-6 [&>svg]:h-6 md:[&>svg]:w-full md:[&>svg]:h-full"
                                    >
                                        {item.icon}
                                    </Button>
                                ))}
                            </div>

                            <div className="flex flex-col w-full md:w-48 xl:w-64 2xl:w-[300px] items-center md:items-start gap-4">
                                {navigationItems.map((item, index) => (
                                    <button
                                        key={index}
                                        className="flex max-w-48 xl:max-w-64 2xl:max-w-[310px] items-center w-full group cursor-pointer"
                                    >
                                        <div className="flex flex-col items-start flex-1">
                                            <div className="flex items-start w-full">
                                                <span
                                                    className={`[font-family:'Atyp_Display-Medium',Helvetica] font-medium text-[6px] xl:text-[7px] 2xl:text-[8px] tracking-[0] leading-[14px] whitespace-nowrap ${item.isActive ? "text-leadership-link" : "text-pure-black"
                                                        } group-hover:text-leadership-link transition-colors`}
                                                >
                                                    {item.label}
                                                </span>
                                                <div className="w-2 xl:w-[9.69px] h-2.5 ml-auto mr-[-0.69px] overflow-hidden">
                                                    <div className="relative top-0.5 left-2.5 w-1 xl:w-[5px] h-1 xl:h-[5px] bg-leadership-link" />
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