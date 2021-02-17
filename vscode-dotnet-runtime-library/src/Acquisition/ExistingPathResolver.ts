/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { IWindowDisplayWorker } from '../EventStream/IWindowDisplayWorker';
import { IDotnetAcquireResult } from '../IDotnetAcquireResult';
import { IExistingPath } from '../IExtensionContext';

export class ExistingPathResolver {
    public resolveExistingPath(existingPaths: IExistingPath[] | undefined, extensionId: string | undefined, windowDisplayWorker: IWindowDisplayWorker): IDotnetAcquireResult | undefined {
        if (existingPaths) {
            if (!extensionId) {
                windowDisplayWorker.showWarningMessage(
                    'Ignoring existing .NET paths defined in settings.json because requesting extension does not define its extension ID. Please file a bug against the requesting extension.',
                    () => { /* No callback */ },
                );
                return;
            }
            const existingPath = existingPaths.filter((pair) => pair.extensionId === extensionId);
            if (existingPath && existingPath.length > 0) {
                return { dotnetPath: existingPath![0].path };
            }
        }
    }
}
