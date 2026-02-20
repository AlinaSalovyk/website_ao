import { XIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import * as Collapsible from "@radix-ui/react-collapsible";
import { Separator } from "@/components/ui/separator";
import type { JSX } from "react";

const educationalPrograms = [
    {
        title: "Бакалаврат",
        description: "І рівень вищої освіти",
        image:
            "/images/EducationalPrograms/BachelorsDegree.png",
    },
    {
        title: "Магістратура",
        description: "ІІ рівень вищої освіти",
        image:
            "/images/EducationalPrograms/Magistracy.png",
    },
    {
        title: "Аспірантура",
        description: "ІІІ освітньо-науковий рівень",
        image:
            "/images/EducationalPrograms/PostgraduateStudies.png",
    },
];

const simpleMenuItems = ["Головна", "Про інститут"];

const bottomSimpleMenuItems = ["Студенське життя", "Наукова діяльність"];

const footerLinksLeft = ["Новини", "Керівництво", "Вступ", "НаУОА"];

const footerLinksRight = ["Facebook", "Instagram", "TikTok"];


interface MenuProps {
    onClose: () => void;
}

export const Menu = ({ onClose }: MenuProps): JSX.Element => {
    const handleClose = () => {
        onClose();
    };

    const [isProgramsOpen, setIsProgramsOpen] = useState(true);
    const [isDepartmentsOpen, setIsDepartmentsOpen] = useState(false);
    const [isLaboratoriesOpen, setIsLaboratoriesOpen] = useState(false);

    const handleNavigation = (item: string) => {
        if (item === "Головна") {
            window.location.href = "/";
        } else if (item === "Про інститут") {
            window.location.href = "/institute";
        }
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-[99] backdrop-blur-sm"
                onClick={handleClose}
            />
            {/* Menu Panel */}
            <div className="flex flex-col h-screen items-start p-6 bg-layout-bg border-r border-solid border-menu-border fixed left-0 top-0 bottom-0 z-[100] overflow-y-auto w-full max-w-[480px] animate-slide-in-left">
                <div className="inline-flex pb-4 flex-col items-start">
                    <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 rounded-full border-pure-white bg-transparent hover:bg-pure-white/10 flex items-center justify-center"
                        onClick={handleClose}
                    >
                        <XIcon className="w-4 h-4 text-pure-white" />
                    </Button>
                </div>

                <div className="flex flex-col items-start justify-between flex-1 self-stretch w-full">
                    <nav className="flex flex-col items-start self-stretch w-full">
                        <div className="flex flex-col max-w-[470.67px] items-start justify-center gap-2.5 py-2 w-full">
                            {simpleMenuItems.map((item, index) => (
                                <div
                                    key={`simple-${index}`}
                                    className="inline-flex flex-col items-start gap-1 w-full"
                                >
                                    <Button
                                        variant="ghost"
                                        className="h-auto p-0 hover:bg-transparent justify-start w-full cursor-pointer"
                                        onClick={() => handleNavigation(item)}
                                    >
                                        <span className="text-white text-2xl leading-8 font-normal">
                                            {item}
                                        </span>
                                    </Button>
                                    <Separator className="w-full h-px bg-[#ffffff33]" />
                                </div>
                            ))}

                            <Collapsible.Root
                                open={isProgramsOpen}
                                onOpenChange={setIsProgramsOpen}
                                className="flex flex-col items-start w-full"
                            >
                                <div className="inline-flex flex-col items-start gap-1 w-full">
                                    <Collapsible.Trigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="h-auto p-0 hover:bg-transparent justify-between w-full cursor-pointer"
                                        >
                                            <span className="text-pure-white text-2xl leading-8 font-normal">
                                                Освітні програми
                                            </span>
                                            <div className="relative flex items-center justify-center w-5 h-5">
                                                <div className="absolute w-5 h-[1px] bg-white transition-transform duration-300" />
                                                <div
                                                    className={cn(
                                                        "absolute w-5 h-[1px] bg-white transition-transform duration-300",
                                                        isProgramsOpen ? "rotate-0" : "-rotate-90"
                                                    )}
                                                />
                                            </div>
                                        </Button>
                                    </Collapsible.Trigger>
                                    <Separator className="w-full h-px bg-[#ffffff33]" />
                                </div>

                                <Collapsible.Content className="flex flex-col items-start w-full">
                                    <div className="flex flex-col items-start w-full">
                                        {educationalPrograms.map((program, index) => (
                                            <a
                                                key={`program-${index}`}
                                                href={`/#${program.title === "Бакалаврат" ? "bachelor" : program.title === "Магістратура" ? "master" : "postgraduate"}`}
                                                onClick={onClose}
                                                className="h-auto max-w-[470.67px] w-full flex items-center gap-3 px-0 py-2 hover:bg-pure-white/5 justify-start cursor-pointer rounded-sm transition-colors"
                                            >
                                                <div className="flex flex-col w-10 h-10 items-start justify-center rounded overflow-hidden flex-shrink-0">
                                                    <div
                                                        className="w-10 h-10 bg-cover bg-center"
                                                        style={{ backgroundImage: `url(${program.image})` }}
                                                    />
                                                </div>

                                                <div className="inline-flex flex-col items-start justify-center">
                                                    <div className="inline-flex flex-col items-start">
                                                        <span className="font-medium text-pure-white text-sm leading-[18px]">
                                                            {program.title}
                                                        </span>
                                                    </div>

                                                    <div className="inline-flex flex-col items-start">
                                                        <span className="font-normal text-news-gray text-xs leading-[18.3px]">
                                                            {program.description}
                                                        </span>
                                                    </div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </Collapsible.Content>
                            </Collapsible.Root>

                            <Collapsible.Root
                                open={isDepartmentsOpen}
                                onOpenChange={setIsDepartmentsOpen}
                                className="flex flex-col items-start w-full"
                            >
                                <div className="inline-flex flex-col items-start gap-1 w-full">
                                    <Collapsible.Trigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="h-auto p-0 hover:bg-transparent justify-between w-full cursor-pointer"
                                        >
                                            <span className="text-pure-white text-2xl leading-8 font-normal">
                                                Кафедри інституту
                                            </span>
                                            <div className="relative flex items-center justify-center w-5 h-5">
                                                <div className="absolute w-5 h-[1px] bg-white transition-transform duration-300" />
                                                <div
                                                    className={cn(
                                                        "absolute w-5 h-[1px] bg-white transition-transform duration-300",
                                                        isDepartmentsOpen ? "rotate-0" : "-rotate-90"
                                                    )}
                                                />
                                            </div>
                                        </Button>
                                    </Collapsible.Trigger>
                                    <Separator className="w-full h-px bg-[#ffffff33]" />
                                </div>
                                <Collapsible.Content className="flex flex-col items-start w-full pl-4">
                                    <Button
                                        variant="ghost"
                                        className="h-auto p-0 hover:bg-transparent justify-start w-full py-2 cursor-pointer"
                                        asChild
                                    >
                                        <a href="/information-technologies-and-data-analytics" className="text-pure-white text-lg leading-6 font-normal">
                                            Кафедра інформаційних технологій та аналітики даних
                                        </a>
                                    </Button>
                                </Collapsible.Content>
                            </Collapsible.Root>

                            <Collapsible.Root
                                open={isLaboratoriesOpen}
                                onOpenChange={setIsLaboratoriesOpen}
                                className="flex flex-col items-start w-full"
                            >
                                <div className="inline-flex flex-col items-start gap-1 w-full">
                                    <Collapsible.Trigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="h-auto p-0 hover:bg-transparent justify-between w-full cursor-pointer"
                                        >
                                            <span className="text-pure-white text-2xl leading-8 font-normal">
                                                Лабораторії інституту
                                            </span>
                                            <div className="relative flex items-center justify-center w-5 h-5">
                                                <div className="absolute w-5 h-[1px] bg-white transition-transform duration-300" />
                                                <div
                                                    className={cn(
                                                        "absolute w-5 h-[1px] bg-white transition-transform duration-300",
                                                        isLaboratoriesOpen ? "rotate-0" : "-rotate-90"
                                                    )}
                                                />
                                            </div>
                                        </Button>
                                    </Collapsible.Trigger>
                                    <Separator className="w-full h-px bg-[#ffffff33]" />
                                </div>
                                <Collapsible.Content className="flex flex-col items-start w-full pl-4">
                                    <Button
                                        variant="ghost"
                                        className="h-auto p-0 hover:bg-transparent justify-start w-full py-2 cursor-pointer"
                                        asChild
                                    >
                                        <a href="/laboratory" className="text-pure-white text-lg leading-6 font-normal">
                                            Лабораторія робототехніки та вбудованих систем
                                        </a>
                                    </Button>
                                </Collapsible.Content>
                            </Collapsible.Root>

                            {bottomSimpleMenuItems.map((item, index) => (
                                <div
                                    key={`bottom-${index}`}
                                    className="inline-flex flex-col items-start gap-1 w-full"
                                >
                                    <Button
                                        variant="ghost"
                                        className="h-auto p-0 hover:bg-transparent justify-start w-full cursor-pointer"
                                        onClick={() => handleNavigation(item)}
                                    >
                                        <span className="text-white text-2xl leading-8 font-normal">
                                            {item}
                                        </span>
                                    </Button>
                                    <Separator className="w-full h-px bg-[#ffffff33]" />
                                </div>
                            ))}
                        </div>
                    </nav>

                    <footer className="flex min-h-[94.38px] justify-end pt-[178.67px] flex-1 self-stretch w-full flex-col items-start">
                        <div className="grid grid-cols-2 gap-2 self-stretch w-full">
                            <div className="flex flex-col items-start gap-2">
                                {footerLinksLeft.map((link, index) => (
                                    <Button
                                        key={`footer-left-${index}`}
                                        variant="ghost"
                                        className="h-auto p-0 hover:bg-transparent justify-start cursor-pointer"
                                    >
                                        <span className="font-normal text-news-gray text-sm leading-4">
                                            {link}
                                        </span>
                                    </Button>
                                ))}
                            </div>

                            <div className="flex flex-col items-start gap-2">
                                {footerLinksRight.map((link, index) => (
                                    <Button
                                        key={`footer-right-${index}`}
                                        variant="ghost"
                                        className="h-auto p-0 hover:bg-transparent justify-start cursor-pointer"
                                    >
                                        <span className="font-normal text-news-gray text-sm leading-4">
                                            {link}
                                        </span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
};

