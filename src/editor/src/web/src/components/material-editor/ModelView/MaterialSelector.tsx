import type { FunctionComponent } from "react";
import { observer } from "mobx-react-lite";
import cn from 'classnames';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

import { ModelEditorViewController } from "@lib/material-editor/model/ModelEditorViewController";

interface Props {
  controller: ModelEditorViewController;
}

export const MaterialSelector: FunctionComponent<Props> = observer(({ controller }) => {
  return (
    <>
      <div className="p-2 bg-gradient-to-b from-[blue] to-teal-500 text-white text-retro-shadow">
        <h2 className="text-lg">{controller.model.path}</h2>
      </div>
      <div className="p-3 bg-slate-300 h-full flex flex-col">
        {controller.allMaterials === undefined ? (
          <div className="italic">
            Model has no materials.
          </div>
        ) : (
          controller.allMaterials.map((material, index, allMaterials) => {
            const isSelected = controller.selectedMaterialName === material.name;
            return (
              <div
                className={cn(
                  { 'grow': index === allMaterials.length - 1 },
                )}
                key={material.name}
              >
                <div /* Row + Children + Preview slot */
                  className={cn('w-full cursor-pointer pl-[10px]')}
                >
                  <div /* Row: Icon + Name + Delete */
                    className={cn("grow flex flex-row text-left",
                      { 'bg-blue-400': isSelected },
                      { 'hover:bg-blue-300 focus:bg-blue-300': !isSelected },
                    )}
                  >
                    {/* Icon */}
                    <span className="shrink-0">
                      <GlobeAltIcon className="icon" />
                    </span>

                    {/* Object name */}
                    <button
                      className="grow pl-1 text-left"
                      onClick={() => controller.selectMaterial(material.name)}
                    >
                      {material.name}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
});
