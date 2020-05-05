/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as fs from 'fs';
import * as path from 'path';
import { Memento } from 'vscode';
import { IAcquisitionInvoker } from '../../Acquisition/IAcquisitionInvoker';
import { IDotnetInstallationContext } from '../../Acquisition/IDotnetInstallationContext';
import { IInstallationValidator } from '../../Acquisition/IInstallationValidator';
import { InstallScriptAcquisitionWorker } from '../../Acquisition/InstallScriptAcquisitionWorker';
import { VersionResolver } from '../../Acquisition/VersionResolver';
import { IEventStream } from '../../EventStream/EventStream';
import { DotnetAcquisitionCompleted, TestAcquireCalled } from '../../EventStream/EventStreamEvents';
import { IEvent } from '../../EventStream/IEvent';
import { ILoggingObserver } from '../../EventStream/ILoggingObserver';
import { ITelemetryReporter } from '../../EventStream/TelemetryObserver';
import { WebRequestWorker } from '../../Utils/WebRequestWorker';
/* tslint:disable:no-any */

export class MockExtensionContext implements Memento {
    private values: { [n: string]: any; } = {};

    public get<T>(key: string): T | undefined;
    public get<T>(key: string, defaultValue: T): T;
    public get(key: any, defaultValue?: any) {
        let value = this.values![key];
        if (typeof value === 'undefined') {
            value = defaultValue;
        }
        return value;
    }
    public update(key: string, value: any): Thenable<void> {
        return this.values[key] = value;
    }
    public clear() {
        this.values = {};
    }
}

export class MockEventStream implements IEventStream {
    public events: IEvent[] = [];
    public post(event: IEvent) {
        this.events = this.events.concat(event);
    }
}

export class NoInstallAcquisitionInvoker extends IAcquisitionInvoker {
    public installDotnet(installContext: IDotnetInstallationContext): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.eventStream.post(new TestAcquireCalled(installContext));
            this.eventStream.post(new DotnetAcquisitionCompleted(installContext.version, installContext.dotnetPath));
            resolve();

        });
    }
}

export class ErrorAcquisitionInvoker extends IAcquisitionInvoker {
    public installDotnet(installContext: IDotnetInstallationContext): Promise<void> {
        throw new Error('Command Failed');
    }
}

// Major.Minor-> Major.Minor.Patch from mock releases.json
export const versionPairs = [['1.0', '1.0.16'], ['1.1', '1.1.13'], ['2.0', '2.0.9'], ['2.1', '2.1.14'], ['2.2', '2.2.8']];

export class FileWebRequestWorker extends WebRequestWorker {
    constructor(extensionState: Memento, eventStream: IEventStream, uri: string, extensionStateKey: string,
                private readonly mockFilePath: string) {
        super(extensionState, eventStream, uri, extensionStateKey);
    }

    protected async makeWebRequest(): Promise<string | undefined> {
        const result =  fs.readFileSync(this.mockFilePath, 'utf8');
        return result;
    }
}

export class FailingWebRequestWorker extends WebRequestWorker {
    constructor(extensionState: Memento, eventStream: IEventStream, uri: string, extensionStateKey: string) {
        super(extensionState, eventStream, '', extensionStateKey); // Empty string as uri
    }

    public async getCachedData(): Promise<string> {
        return super.getCachedData(0); // Don't retry
    }
}

export class MockWebRequestWorker extends WebRequestWorker {
    public readonly errorMessage = 'Web Request Failed';
    private requestCount = 0;
    private readonly response = 'Mock Web Request Result';

    constructor(extensionState: Memento, eventStream: IEventStream, url: string, extensionStateKey: string, private readonly succeed = true) {
        super(extensionState, eventStream, url, extensionStateKey);
    }

    public getRequestCount() {
        return this.requestCount;
    }

    protected async makeWebRequest(): Promise<string | undefined> {
        this.requestCount++;
        if (this.succeed) {
            this.cacheResults(this.response);
            return this.response;
        } else {
            throw new Error(this.errorMessage);
        }
    }
}

export class MockVersionResolver extends VersionResolver {
    private readonly filePath = path.join(__dirname, '../../..', 'src', 'test', 'mocks', 'mock-releases.json');

    constructor(extensionState: Memento, eventStream: IEventStream) {
        super(extensionState, eventStream);
        this.webWorker = new FileWebRequestWorker(extensionState, eventStream, '', 'releases', this.filePath);
    }
}

export class MockInstallScriptWorker extends InstallScriptAcquisitionWorker {
    constructor(extensionState: Memento, eventStream: IEventStream, failing: boolean) {
        super(extensionState, eventStream);
        this.webWorker = failing ?
            new FailingWebRequestWorker(extensionState, eventStream, '', '') :
            new MockWebRequestWorker(extensionState, eventStream, '', '');
    }
}

export class FailingInstallScriptWorker extends InstallScriptAcquisitionWorker {
    constructor(extensionState: Memento, eventStream: IEventStream) {
        super(extensionState, eventStream);
        this.webWorker = new MockWebRequestWorker(extensionState, eventStream, '', '');
    }

    protected writeScriptAsFile(scriptContent: string, filePath: string) {
        throw new Error('Failed to write file');
    }
}

export interface ITelemetryEvent {
    eventName: string;
    properties?: {
        [key: string]: string;
    } | undefined;
    measures?: {
        [key: string]: number;
    } | undefined;
}

export type TelemetryEvents = ITelemetryEvent[];

export class MockTelemetryReporter implements ITelemetryReporter {

    public static telemetryEvents: TelemetryEvents = [];

    public async dispose(): Promise<void> {
        // Nothing to dispose
    }

    public sendTelemetryEvent(eventName: string, properties?: { [key: string]: string; } | undefined, measures?: { [key: string]: number; } | undefined): void {
        MockTelemetryReporter.telemetryEvents = MockTelemetryReporter.telemetryEvents.concat({eventName, properties, measures});
    }

    public sendTelemetryErrorEvent(eventName: string, properties?: { [key: string]: string }, measures?: { [key: string]: number }, errorProps?: string[]): void {
        eventName = `[ERROR]:${eventName}`;
        MockTelemetryReporter.telemetryEvents = MockTelemetryReporter.telemetryEvents.concat({eventName, properties, measures});
    }
}

export class MockInstallationValidator extends IInstallationValidator {
    public validateDotnetInstall(version: string, dotnetPath: string): void {
        // Always validate
    }
}

export class MockLoggingObserver implements ILoggingObserver {
    public post(event: IEvent): void {
        // Nothing to post
    }

    public dispose(): void {
        // Nothing to dispose
    }

    public getFileLocation(): string {
        return 'Mock file location';
    }
}
