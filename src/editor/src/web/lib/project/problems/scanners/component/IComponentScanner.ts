import { ComponentDefinition } from "@polyzone/runtime/cartridge";
import { ReportProblemFn, ScannerContext } from "../../ProblemScanner";

export interface IComponentScanner {
  scan(component: ComponentDefinition, reportProblem: ReportProblemFn, context: ScannerContext): void;
}
