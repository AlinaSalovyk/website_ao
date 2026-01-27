import { ArrowRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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


export const EducationalProgramsSection = (): JSX.Element => {
    return (
        <section className="w-full flex items-center justify-center px-0 py-20 bg-white">
            <div className="flex flex-col max-w-[1440px] w-full items-start gap-12 px-9 py-0">
                <div className="flex flex-col items-end w-full">
                    <header className="flex flex-col items-start w-full mb-10 translate-y-[-1rem] animate-fade-in opacity-0">
                        <h2 className="w-full text-center [font-family:'Atyp_Display-Medium',Helvetica] font-medium text-black text-[80px] tracking-[0] leading-[80px]">
                            Новини та події
                        </h2>
                    </header>

                    <div className="flex flex-col w-full items-end pt-10 pb-0 px-0 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
                        <div className="w-full bg-[#727a83] h-px" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-20 w-full">
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
                                                    className="h-7 px-[18px] py-2 rounded-full border-[#0e52ff] text-[#0e52ff] [font-family:'Atyp_Display-Regular',Helvetica] font-normal text-xs tracking-[0] leading-[10px]"
                                                >
                                                    {item.badge}
                                                </Badge>

                                                <time className="[font-family:'Atyp_Display-Light',Helvetica] font-light text-black text-sm text-right tracking-[0] leading-[18px]">
                                                    {item.date}
                                                </time>
                                            </div>

                                            <div className="flex flex-col items-start gap-[15px] w-full">
                                                <h3 className="[font-family:'Atyp_Display-Medium',Helvetica] font-medium text-black text-xl tracking-[0] leading-7 whitespace-pre-line">
                                                    {item.title}
                                                </h3>

                                                <p className="[font-family:'Atyp_Display-Regular',Helvetica] font-normal text-[#727a83] text-xs tracking-[0] leading-[10px]">
                                                    {item.readTime}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col w-full items-start pt-10 pb-0 px-0">
                                        <div className="flex flex-col w-full items-start gap-[3px]">
                                            <div className="flex items-center justify-between w-full group-hover:translate-x-1 transition-transform duration-300">
                                                <span className="[font-family:'Atyp_Text-Regular',Helvetica] font-normal text-black text-xs tracking-[0] leading-4">
                                                    {item.link}
                                                </span>

                                                <ArrowRightIcon className="w-[19px] h-3" />
                                            </div>

                                            <div className="w-full h-px bg-black rounded-sm" />
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
