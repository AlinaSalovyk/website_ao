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
                <div className="flex flex-col max-w-7xl 2xl:max-w-screen-2xl w-full items-start px-9">
                    <header className="flex flex-col items-start w-full mb-10 translate-y-[-1rem] animate-fade-in opacity-0">
                        <h2 className="w-full text-center font-medium text-pure-black text-5xl xl:text-7xl 2xl:text-[80px] tracking-[0] leading-tight xl:leading-[80px]">
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
                                        className="w-full h-36 xl:h-44 2xl:h-[198px] rounded-lg bg-cover bg-center bg-no-repeat"
                                        style={{ backgroundImage: `url(${item.backgroundImage})` }}
                                    />

                                    <div className="flex flex-col items-start justify-center pt-4 xl:pt-5 2xl:pt-[22px] pb-0 px-0 flex-1">
                                        <div className="flex flex-col items-start gap-6 w-full">
                                            <div className="flex items-center justify-between w-full">
                                                <Badge
                                                    variant="outline"
                                                    className="h-7 px-3 xl:px-4 2xl:px-[18px] py-2 rounded-full border-leadership-link text-leadership-link font-normal text-xs tracking-[0] leading-[10px]"
                                                >
                                                    {item.badge}
                                                </Badge>

                                                <time className="font-light text-pure-black text-sm text-right tracking-[0] leading-[18px]">
                                                    {item.date}
                                                </time>
                                            </div>

                                            <div className="flex flex-col items-start gap-3 xl:gap-4 2xl:gap-[15px] w-full">
                                                <h3 className="font-medium text-pure-black text-xl tracking-[0] leading-7 whitespace-pre-line">
                                                    {item.title}
                                                </h3>

                                                <p className="font-normal text-news-gray text-xs tracking-[0] leading-[10px]">
                                                    {item.readTime}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col w-full items-start pt-10 pb-0 px-0">
                                        <div className="flex flex-col w-full items-start gap-1 2xl:gap-[3px]">
                                            <div className="flex items-center justify-between w-full group-hover:translate-x-1 transition-transform duration-300">
                                                <span className="font-normal text-pure-black text-xs tracking-[0] leading-4">
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
        </section>
    );
};