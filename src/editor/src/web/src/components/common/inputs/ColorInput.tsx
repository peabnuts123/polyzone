import { observer } from "mobx-react-lite";
import { KeyboardEventHandler, useEffect, useMemo, useRef, useState, type FunctionComponent } from "react";
import { ColorResult, getContrastingColor, rgbaToHex } from '@uiw/color-convert';
import Sketch from '@uiw/react-color-sketch';
import cn from 'classnames';

import { Color3 } from "@polyzone/core/src/util";

interface CommonProps {
  label: string;
  color: Color3;
  /**
   * Container that this input lives in.
   * The color picker is expected to fit within this container.
   */
  containerRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}

interface SimpleProps extends CommonProps {
  onChange?: (newValue: Color3) => void;
}

interface TogglableProps extends CommonProps {
  togglable: true;
  enabled: boolean;
  onColorChange?: (newValue: Color3) => void;
  onEnabledChange?: (newValue: boolean) => void;
}

export type ColorInputProps = SimpleProps | TogglableProps;

export const ColorInput: FunctionComponent<ColorInputProps> = observer((props) => {
  const { label, color, containerRef, className } = props;

  const isTogglable = 'togglable' in props;

  // Prop defaults
  const onColorChange = (isTogglable ? props.onColorChange : props.onChange) || (() => { });
  const onEnabledChange = (isTogglable && props.onEnabledChange ? props.onEnabledChange : () => { });

  // Refs
  const divRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // State
  const [isColorPickerVisible, setIsColorPickerVisible] = useState<boolean>(false);
  const [hasPickerCalculatedItsPositionYet, setHasPickerCalculatedItsPositionYet] = useState<boolean>(false);
  const [showColorPickerBelow, setShowColorPickerBelow] = useState<boolean>(false);

  // Computed state
  const colorHex = rgbaToHex({ r: color.r, g: color.g, b: color.b, a: 255 });
  const textColor = getContrastingColor(colorHex);
  const isEnabled = isTogglable ? props.enabled : true;
  const showColorPickerAbove = !showColorPickerBelow;

  // Memoized state
  const initialColor = useMemo(() => colorHex, [isColorPickerVisible]);

  /*
   * Toggle visibility of the picker when anything under this control has
   * focus. Close enough for what we're doing here.
   */
  useEffect(() => {
    const onFocus = (e: FocusEvent): void => {
      const isTargetChildOfThisControl = divRef.current!.contains(e.target as Node);
      setIsColorPickerVisible(isTargetChildOfThisControl);
      setShowColorPickerBelow(false);
      setHasPickerCalculatedItsPositionYet(false);
    };

    document.addEventListener('focusin', onFocus);
    return () => {
      document.removeEventListener('focusin', onFocus);
    };
  }, []);

  useEffect(() => {
    // Situation:
    // - Container ref is specified
    // - Color picker has just popped up

    // Calculate the popup direction (i.e. show above / below the control)
    if (containerRef?.current && isColorPickerVisible && pickerRef.current) {
      const pickerRects = pickerRef.current.getClientRects();
      const containerRects = containerRef.current.getClientRects();

      // @NOTE Assumption: Picker has currently rendered (invisibly) ABOVE the control
      setShowColorPickerBelow(pickerRects[0].y <= containerRects[0].y);
    }

    // Either way, show the color picker
    setHasPickerCalculatedItsPositionYet(true);
  }, [isColorPickerVisible]);

  // Functions
  /**
   * Hide the colour picker when user presses Escape
   */
  const onKeyPress: KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (!isColorPickerVisible) return;
    if (e.key === 'Escape') {
      setIsColorPickerVisible(false);
    }
  };

  /**
   * Hide the colour picker when user clicks outside of it
   */
  const onClickFacade = (): void => {
    setIsColorPickerVisible(false);
  };

  const onColorPickerChange = ({ rgb }: ColorResult): void => {
    const result = new Color3(rgb.r, rgb.g, rgb.b);
    onColorChange(result);
  };

  return (
    <div className={className}>
      <div>
        <label className="font-bold flex flex-row items-center">
          {isTogglable && (
            <input
              type="checkbox"
              className="mr-2 w-4 h-4"
              checked={isEnabled}
              onChange={(e) => onEnabledChange(e.target.checked)}
            />
          )}
          {label}
        </label>
      </div>
      <div className="relative" onKeyDown={onKeyPress} ref={divRef}>
        <input
          type="text"
          className="w-full p-2 disabled:opacity-30"
          style={{ backgroundColor: colorHex, color: textColor }}
          value={colorHex}
          readOnly={true}
          disabled={!isEnabled}
        />

        {isColorPickerVisible && (
          <Sketch
            /* @NOTE Bloody hell, react-color has all these hard-coded inline styles that have to be overridden */
            className={cn(
              "color-picker absolute !w-full z-20 !rounded-none !shadow-none border border-[blue]",
              {
                'bottom-full': showColorPickerAbove,
                'opacity-0': !hasPickerCalculatedItsPositionYet,
              },
            )}
            ref={pickerRef}
            color={initialColor}
            disableAlpha={true}
            presetColors={false}
            onChange={onColorPickerChange}
          />
        )}

      </div>
      {isColorPickerVisible && (
        <div
          className="w-screen h-screen absolute inset-0 z-10"
          onClick={onClickFacade}
        />
      )}
    </div>
  );
});
