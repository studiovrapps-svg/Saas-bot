import React, { useState, useRef, useEffect } from 'react';

const CustomSelect = ({ value, onChange, options, placeholder = "Selecciona una opción" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full border p-3.5 pr-10 rounded-xl bg-gray-50 flex items-center justify-between cursor-pointer transition shadow-sm font-medium ${isOpen ? 'border-black ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'} text-gray-800`}
            >
                <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                    <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-fade-in py-1">
                    <ul className="max-h-60 overflow-y-auto custom-scrollbar">
                        {options.map((option) => (
                            <li 
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`px-4 py-2 cursor-pointer text-sm transition-colors ${value === option.value ? 'bg-gray-100 text-black font-bold' : 'text-gray-700 font-medium hover:bg-gray-100 hover:text-black'}`}
                            >
                                {option.label}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
