import { useLocale } from "@calcom/lib/hooks/useLocale";
import { Icon } from "@calcom/ui";
import {
  Dropdown,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@calcom/ui/v2/core/Dropdown";

interface IAddVariablesDropdown {
  addVariable: (isEmailSubject: boolean, variable: string) => void;
  isEmailSubject: boolean;
}

const variables = [
  "event_name",
  "organizer_name",
  "attendee_name",
  "event_date",
  "event_time",
  "location",
  "additional_notes",
];

export const AddVariablesDropdown = (props: IAddVariablesDropdown) => {
  const { t } = useLocale();

  return (
    <Dropdown>
      <DropdownMenuTrigger className="text-sm text-gray-900 focus:bg-transparent focus:ring-transparent focus:ring-offset-0 ">
        {t("add_variable")}
        <Icon.FiChevronDown className="ml-1 h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="h-40 overflow-scroll">
        <div className="p-3">
          <div className="mb-2 text-xs text-gray-500">{t("add_dynamic_variables").toLocaleUpperCase()}</div>
          {variables.map((variable) => (
            <DropdownMenuItem key={variable}>
              <button
                key={variable}
                type="button"
                className="button w-full py-2"
                onClick={() => props.addVariable(props.isEmailSubject, t(`${variable}_workflow`))}>
                <div className="grid grid-cols-2 gap-7">
                  <div className="col-span-1 text-left">
                    {`{${t(`${variable}_workflow`).toUpperCase().replace(" ", "_")}}`}
                  </div>
                  <div className="col-span-1 text-left">{t(`${variable}_workflow`)}</div>
                </div>
              </button>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </Dropdown>
  );
};
