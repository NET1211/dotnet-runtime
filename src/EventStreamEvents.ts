/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExecException } from 'child_process';
import { EventType } from './EventType';
import { IEvent } from './IEvent';

// tslint:disable max-classes-per-file

export class DotnetAcquisitionStarted implements IEvent {
    public readonly type = EventType.DotnetAcquisitionStart;
}

export abstract class DotnetAcquisitionError implements IEvent {
    public readonly type = EventType.DotnetAcquisitionError;

    public abstract getErrorMessage(): string;
}

export class DotnetAcquisitionUnexpectedError extends DotnetAcquisitionError {
    constructor(private readonly error: any) {
        super();
    }

    public getErrorMessage(): string {
        if (this.error) {
            return this.error.toString();
        }

        return '';
    }
}

export class DotnetAcquisitionInstallError extends DotnetAcquisitionError {
    constructor(private readonly error: ExecException) {
        super();
    }

    public getErrorMessage(): string {
        return `Exit code: ${this.error.code}
Message: ${this.error.message}
Stack: ${this.error.stack}`;
    }
}

export class DotnetAcquisitionScriptError extends DotnetAcquisitionError {
    constructor(private readonly error: string) {
        super();
    }

    public getErrorMessage(): string {
        return this.error;
    }
}

export class DotnetAcquisitionCompleted implements IEvent {
    public readonly type = EventType.DotnetAcquisitionCompleted;
}
