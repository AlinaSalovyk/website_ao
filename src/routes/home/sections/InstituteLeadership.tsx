import { Separator } from "@/components/ui/separator";
import { useState, type JSX } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface LeadershipMember {
    id: number;
    name: string;
    role: string;
    email: string;
    officeHours: string;
    image: string;
}

const leadershipData: LeadershipMember[] = [
    {
        id: 1,
        name: "Новоселецький Олександр Миколайович",
        role: "Директор Інституту ІТ та бізнесу, кандидат економічних наук, доцент кафедри інформаційних технологій та аналітики даних",
        email: "oleksandr.novoseletskyi@oa.edu.ua",
        officeHours: "понеділок - п'ятниця: 8.30-17.30, обідня перерва: 12.30-13.30",
        image: "/images/InstituteManagement/novoseletskyy.jpg"
    },
    {
        id: 2,
        name: "Шулик Юлія Віталіївна",
        role: "Заступник директора з навчально-наукової роботи, кандидат економічних наук, доцент, завідувач кафедри фінансів та бізнесу",
        email: "yulia.shulyk@oa.edu.ua",
        officeHours: "понеділок-п'ятниця: 8.30-17.30, обідня перерва 12.30-13.30",
        image: "/images/InstituteManagement/shulyk.jpg"
    },
    {
        id: 3,
        name: "Чернявський Андрій Володимирович",
        role: "Заступник директора з навчально-виховної роботи, викладач кафедри інформаційних технологій та аналітики даних",
        email: "andrii.cherniavskyi@oa.edu.ua",
        officeHours: "понеділок - п'ятниця: 8.30-17.30, обідня перерва: 12.30-13.30",
        image: "/images/InstituteManagement/cherniavskyi.jpg"
    },
    {
        id: 4,
        name: "Козак Людмила Василівна",
        role: "Заступник директора з питань якості освіти, доктор економічних наук, доцент кафедри менеджменту та маркетингу",
        email: "lyudmyla.kozak@oa.edu.ua",
        officeHours: "понеділок - п'ятниця: 8.30-17.30, обідня перерва: 12.30-13.30",
        image: "/images/InstituteManagement/Kozak.jpg"
    },
    {
        id: 5,
        name: "Новак Анна Федорівна",
        role: "Заступник директора з профорієнтаційної роботи, викладач кафедри фінансів та бізнесу",
        email: "anna.novak@oa.edu.ua",
        officeHours: "понеділок - п'ятниця: 8.30-17.30, обідня перерва: 12.30-13.30",
        image: "/images/InstituteManagement/novak.jpg"
    },
    {
        id: 6,
        name: "Галецька Тамара Володимирівна",
        role: "Старший лаборант",
        email: "dekanat.ekonomichnyi@oa.edu.ua",
        officeHours: "понеділок - п'ятниця: 8.30-17.30, обідня перерва: 12.30-13.30",
        image: "/images/InstituteManagement/haletska.jpg"
    }
];

export const InstituteLeadership = (): JSX.Element => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % leadershipData.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + leadershipData.length) % leadershipData.length);
    };

    const currentMember = leadershipData[currentIndex];

    return (
        // Using a grey background similar to the screenshot
        <section className="w-full bg-white flex flex-col relative py-20 transition-colors duration-300">
            <div className="flex flex-col max-w-7xl 2xl:max-w-screen-2xl mx-auto w-full px-4 md:px-9">

                {/* Header - Right Aligned as per grey screenshot */}
                <h2 className="font-['Roboto',sans-serif] font-bold text-4xl md:text-5xl lg:text-6xl text-black text-right mb-10">
                    Керівництво інституту
                </h2>
                <Separator className="w-full bg-black/40 h-px mb-16" />

                {/* Content Container */}
                <div className="flex flex-col items-center w-full max-w-5xl mx-auto">

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-16 w-full animate-fade-in">

                        {/* Image */}
                        <div className="w-full md:w-[350px] aspect-square md:aspect-[4/5] overflow-hidden rounded-xl flex-shrink-0 bg-gray-300 shadow-lg">
                            <img
                                src={currentMember.image}
                                alt={currentMember.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x500?text=No+Image';
                                }}
                            />
                        </div>

                        {/* Text Info */}
                        <div className="flex flex-col text-left py-4 flex-1">
                            {/* Name */}
                            <h3 className="font-['Roboto',sans-serif] font-bold text-2xl md:text-3xl text-black mb-1">
                                {currentMember.name}
                            </h3>

                            {/* Role */}
                            <p className="font-['Roboto',sans-serif] text-sm md:text-base text-black/80 mb-10 leading-relaxed max-w-lg">
                                {currentMember.role}
                            </p>

                            {/* Contact Info */}
                            <div className="flex flex-col gap-6">
                                <div>
                                    <p className="font-['Roboto',sans-serif] font-bold text-sm text-black mb-1">
                                        Контактна інформація:
                                    </p>
                                    <a href={`mailto:${currentMember.email}`} className="font-['Roboto',sans-serif] text-sm text-black hover:underline">
                                        e-mail: {currentMember.email}
                                    </a>
                                </div>

                                <div>
                                    <p className="font-['Roboto',sans-serif] font-bold text-sm text-black mb-1">
                                        Офісні години:
                                    </p>
                                    <p className="font-['Roboto',sans-serif] text-sm text-black">
                                        {currentMember.officeHours}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Arrows */}
                    <div className="flex items-center gap-8 mt-16 md:mt-20">
                        <button
                            onClick={handlePrev}
                            className="p-3 hover:bg-black/10 rounded-full transition-colors group cursor-pointer"
                            aria-label="Previous member"
                        >
                            <ArrowLeft className="w-8 h-8 text-black group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                            onClick={handleNext}
                            className="p-3 hover:bg-black/10 rounded-full transition-colors group cursor-pointer"
                            aria-label="Next member"
                        >
                            <ArrowRight className="w-8 h-8 text-black group-hover:scale-110 transition-transform" />
                        </button>
                    </div>

                </div>
            </div>
        </section>
    );
};