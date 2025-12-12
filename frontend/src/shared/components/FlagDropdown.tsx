import { ChevronDown } from "lucide-react";

interface FlagDropdownType {
    [key: string]: unknown;
    flag?: string;
}

interface FdProps {
    value: string;
    onChange: (value: string) => void;
    isOpen: boolean;
    onToggle: () => void;
    options: FlagDropdownType[];
    labelKey: string;
    placeholder?: string;
    className?: string;
}

const FlagDropdown: React.FC<FdProps> = ({
    value,
    onChange,
    isOpen,
    onToggle,
    options,
    labelKey,
    placeholder = 'The fool dev forgot to put an option here',
    className = '',
}) => {
    //first get selected option object
    const selectedOption = options.find(opt => opt[labelKey] === value);

    //handle option selection
    const handleSelect = (optionValue: string) => {
        onChange(optionValue)
        onToggle(); //close dropdown
    };

   

    return(
        <div className= {` flex items-center justify-center relative`}>
            <div className="w-7">
                {selectedOption?.flag && (
                    <img 
                        src= {selectedOption.flag} 
                        alt= {`${value} flag`}
                        className="h-5 w-6" 
                    />
                )}
            </div>

            <button
                onClick={onToggle}
                className="flex items-center justify-between p-2 cursor-pointer"
                type="button"
            >
                { value || placeholder}
                <ChevronDown size={16} className= {`ml-2 transition-transform duration-300 ${isOpen ? 'rotate-180': ''}`}/>
            </button>

            <div
                className = {`${className} absolute top-full w-max max-w-52 shadow-md z-50 transition-all overflow-hidden duration-1000 ease-in-out  ${ isOpen ? 'max-h-28': 'max-h-0' }`}
                >
                    <div className="overflow-y-scroll scrollbar-thin max-h-28 px-4">
                        {
                            options.map((o, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSelect(String(o[labelKey]))}
                                    className="w-full flex items-center gap-2 p-2 cursor-pointer hover:bg-secondary-200 transition-colors"
                                    type="button"
                                >
                                    {String(o[labelKey])}
                                </button>
                            ))
                        }
                    </div>

            </div>
        </div>
    )
}

export default FlagDropdown