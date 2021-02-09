/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { ICommandProvider } from './Commands/ICommandProvider';
import { IWindowDisplayWorker } from './EventStream/IWindowDisplayWorker';
import { ITelemetryReporter } from './EventStream/TelemetryObserver';

export interface IExtensionContext {
    commandPrefix: string; // Prefix for commands
    configPrefix: string; // Prefix for user settings
    displayChannelName: string;
    defaultTimeoutValue: number;
    commandProvider: ICommandProvider;
    storagePath?: string;
    telemetryReporter?: ITelemetryReporter;
    extensionConfiguration?: IExtensionConfiguration;
    displayWorker?: IWindowDisplayWorker;
}

export interface IExtensionConfiguration {
    get<T>(name: string): T | undefined;
    update<T>(section: string, value: T, globalSettings: boolean): Thenable<void>;
}

export namespace ExistingPathKeys {
    export const extensionIdKey = 'extensionId';
    export const pathKey = 'path';
}

export interface IExistingPath {
    [ExistingPathKeys.extensionIdKey]: string;
    [ExistingPathKeys.pathKey]: string;
}
