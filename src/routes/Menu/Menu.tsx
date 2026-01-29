import { MinusIcon, PlusIcon, XIcon } from "lucide-react";
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

    const handleNavigation = (item: string) => {
        if (item === "Головна") {
            onClose();
        }
        // Add more navigation logic here as needed
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-[99] backdrop-blur-sm"
                onClick={handleClose}
            />
            {/* Menu Panel */}
            <div className="flex flex-col h-screen items-start p-6 bg-[#0f1215] border-r border-solid border-[#ffffff4c] fixed left-0 top-0 bottom-0 z-[100] overflow-y-auto w-full max-w-[480px] animate-slide-in-left">
                <div className="inline-flex pb-4 flex-col items-start">
                    <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 rounded-full border-white bg-transparent hover:bg-white/10 flex items-center justify-center"
                        onClick={handleClose}
                    >
                        <XIcon className="w-4 h-4 text-white" />
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
                                        className="h-auto p-0 hover:bg-transparent justify-start w-full"
                                        onClick={() => handleNavigation(item)}
                                    >
                                        <span className="[font-family:'Atyp_Display-Regular',Helvetica] text-white text-2xl leading-8 font-normal">
                                            {item}
                                        </span>
                                    </Button>
                                    <Separator className="w-full h-px bg-[#ffffff33]" />
                                </div>
                            ))}

                            <Collapsible.Root
                                defaultOpen
                                className="flex flex-col items-start w-full"
                            >
                                <div className="inline-flex flex-col items-start gap-1 w-full">
                                    <Collapsible.Trigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="h-auto p-0 hover:bg-transparent justify-between w-full"
                                        >
                                            <span className="[font-family:'Atyp_Display-Regular',Helvetica] text-white text-2xl leading-8 font-normal">
                                                Освітні програми
                                            </span>
                                            <MinusIcon className="w-5 h-5 text-white" />
                                        </Button>
                                    </Collapsible.Trigger>
                                    <Separator className="w-full h-px bg-[#ffffff33]" />
                                </div>

                                <Collapsible.Content className="flex flex-col items-start w-full">
                                    <div className="flex flex-col items-start w-full">
                                        {educationalPrograms.map((program, index) => (
                                            <Button
                                                key={`program-${index}`}
                                                variant="ghost"
                                                className="h-auto max-w-[470.67px] w-full items-center gap-3 px-0 py-2 hover:bg-white/5 justify-start"
                                            >
                                                <div className="flex flex-col w-10 h-10 items-start justify-center rounded overflow-hidden flex-shrink-0">
                                                    <div
                                                        className="w-10 h-10 bg-cover bg-center"
                                                        style={{ backgroundImage: `url(${program.image})` }}
                                                    />
                                                </div>

                                                <div className="inline-flex flex-col items-start justify-center">
                                                    <div className="inline-flex flex-col items-start">
                                                        <span className="[font-family:'Atyp_Display-Medium',Helvetica] font-medium text-white text-sm leading-[18px]">
                                                            {program.title}
                                                        </span>
                                                    </div>

                                                    <div className="inline-flex flex-col items-start">
                                                        <span className="[font-family:'Inter',Helvetica] font-normal text-[#727a83] text-xs leading-[18.3px]">
                                                            {program.description}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Button>
                                        ))}
                                    </div>
                                </Collapsible.Content>
                            </Collapsible.Root>

                            <Collapsible.Root className="flex flex-col items-start w-full">
                                <div className="inline-flex flex-col items-start gap-1 w-full">
                                    <Collapsible.Trigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="h-auto p-0 hover:bg-transparent justify-between w-full"
                                        >
                                            <span className="[font-family:'Atyp_Display-Regular',Helvetica] text-white text-2xl leading-8 font-normal">
                                                Кафедри інституту
                                            </span>
                                            <PlusIcon className="w-5 h-5 text-white" />
                                        </Button>
                                    </Collapsible.Trigger>
                                    <Separator className="w-full h-px bg-[#ffffff33]" />
                                </div>
                            </Collapsible.Root>

                            {bottomSimpleMenuItems.map((item, index) => (
                                <div
                                    key={`bottom-${index}`}
                                    className="inline-flex flex-col items-start gap-1 w-full"
                                >
                                    <Button
                                        variant="ghost"
                                        className="h-auto p-0 hover:bg-transparent justify-start w-full"
                                        onClick={() => handleNavigation(item)}
                                    >
                                        <span className="[font-family:'Atyp_Display-Regular',Helvetica] text-white text-2xl leading-8 font-normal">
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
                                        className="h-auto p-0 hover:bg-transparent justify-start"
                                    >
                                        <span className="[font-family:'Inter',Helvetica] font-normal text-[#727a83] text-sm leading-4">
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
                                        className="h-auto p-0 hover:bg-transparent justify-start"
                                    >
                                        <span className="[font-family:'Inter',Helvetica] font-normal text-[#727a83] text-sm leading-4">
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

