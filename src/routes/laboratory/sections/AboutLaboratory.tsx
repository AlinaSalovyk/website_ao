import React, { type JSX } from "react";
import { partnerLogos } from "@/components/icons/PartnerLogos";

export const AboutLaboratory = (): JSX.Element => {
    return (
        <section className="w-full bg-pure-white text-pure-black pt-20 pb-10 2xl:pt-24 2xl:pb-12">
            <div className="container mx-auto px-4 md:px-9 flex flex-col">

                {/* Header */}
                <div className="flex justify-end mb-16 md:mb-24 border-b border-pure-black pb-4">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl 2xl:text-7xl font-bold font-['Roboto',sans-serif]">
                        Про лабораторію
                    </h2>
                </div>

                {/* Content Block 1: Problems and Opportunities */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 border-b border-pure-black pb-16 md:pb-24 mb-16 md:mb-24">
                    <div className="lg:col-span-4">
                        <h3 className="text-2xl md:text-3xl font-bold font-['Roboto',sans-serif]">Проблеми й можливості</h3>
                    </div>
                    <div className="lg:col-span-5">
                        <p className="text-base md:text-lg font-['Roboto',sans-serif] leading-relaxed">
                            Підрозділам потрібні прості, надійні та доступні технічні рішення — від кріплень і телеметрії до навчальних тренажерів, випробувальних стендів, систем живлення, логістики й діагностики — з мінімальними термінами розробки та постачання. Водночас серійні аналоги часто відсутні або є економічно недоцільними, а їх отримання займає надто багато часу. Наш підхід базується на швидкому реінжинірингу та відновленні вузлів, наданих замовником, у поєднанні з 3D-друком, лазерною обробкою та оперативним виготовленням PCB, що дозволяє створювати робочі прототипи за лічені тижні, а не місяці.
                        </p>
                    </div>
                    <div className="hidden lg:block lg:col-span-3">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                            <img
                                src="/images/EducationalPrograms/BachelorsDegree.png"
                                alt="Abstract 3D Shape"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Content Block 2: Architecture */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 border-b border-pure-black pb-16 md:pb-24 mb-16 md:mb-24">
                    <div className="lg:col-span-4">
                        <h3 className="text-2xl md:text-3xl font-bold font-['Roboto',sans-serif]">Архітектура лабораторії</h3>
                    </div>
                    <div className="lg:col-span-5">
                        <ul className="space-y-6 text-base md:text-lg font-['Roboto',sans-serif] leading-relaxed">
                            <li>
                                <strong>Комп'ютерна зона (17–24 робочих місця)</strong>
                                <br /> Простір для CAD-проєктування, симуляцій, аналітики та роботи з даними.
                            </li>
                            <li>
                                <strong>Скляна тест-зона (4x3 м)</strong>
                                <br /> Обладнана зона з розміткою та безпековими елементами для випробувань мобільних і роботизованих платформ.
                            </li>
                            <li>
                                <strong>Зона електроніки та 3D-прототипування</strong>
                                <br /> Робоче місце для пайки, створення прототипів і тестування рішень із використанням 3D-принтерів, 3D-сканера та лазерного обладнання.
                            </li>
                            <li>
                                <strong>Верстак для PCB-прототипування</strong>
                                <br /> Повний цикл виготовлення друкованих плат: фрезерування або лазерна обробка, УФ-експозиція та травлення.
                            </li>
                            <li>
                                <strong>Міні-ПК для AI-інференсу</strong>
                                <br /> Обчислювальні вузли для задач комп'ютерного зору, навігації, аналізу та класифікації сигналів.
                            </li>
                        </ul>
                    </div>
                    <div className="hidden lg:block lg:col-span-3">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                            <img
                                src="/images/EducationalPrograms/Magistracy.png"
                                alt="Abstract Rings"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Content Block 3: Examples */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 border-b border-pure-black pb-16 md:pb-24 mb-16 md:mb-24">
                    <div className="lg:col-span-4">
                        <h3 className="text-2xl md:text-3xl font-bold font-['Roboto',sans-serif]">Приклади типових виробів</h3>
                    </div>
                    <div className="lg:col-span-5">
                        <ul className="list-disc pl-5 space-y-2 text-base md:text-lg font-['Roboto',sans-serif] leading-relaxed">
                            <li>Модульні кріплення/кожухи для оптики, антен, камер; амортизуючі платформи.</li>
                            <li>Стенди й тренажери для навчання операторів та для діагностики вузлів.</li>
                            <li>Системи живлення (DC-DC, батарейні модулі, герметичні бокс-кейси).</li>
                            <li>Телеметричні вузли (ENV-датчики, лічильники ресурсу) з локальним записом.</li>
                            <li>Наземні тест-роботи для відпрацювання алгоритмів навігації (без бойового застосування).</li>
                        </ul>
                        <div className="mt-8 italic text-sm md:text-base text-black">
                            <p>Жодних летальних рішень:<br /> пріоритет — безпека, гуманітарні й навчальні задачі.</p>
                        </div>
                    </div>
                    <div className="hidden lg:block lg:col-span-3">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                            <img
                                src="/images/EducationalPrograms/PostgraduateStudies.png"
                                alt="Abstract Digital Block"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Partners Footer */}
                <div className="w-full overflow-hidden py-12 bg-pure-white">
                    <div className="flex items-center gap-16 animate-marquee-seamless">
                        {[...Array(18)].map((_, setIndex) => (
                            <React.Fragment key={setIndex}>
                                {partnerLogos}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
};
