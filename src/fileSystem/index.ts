import * as path from "path";
import {
  Disposable,
  Event,
  EventEmitter,
  FileChangeEvent,
  FileStat,
  FileSystemError,
  FileSystemProvider,
  FileType,
  Uri,
  workspace
} from "vscode";
import { FS_SCHEME } from "../constants";
import { onboardtour, onboardtourStep, store } from "../store";

export class onboardtourFileSystemProvider implements FileSystemProvider {
  private count = 0;

  getCurrentTourStep(): [onboardtour, onboardtourStep] {
    const tour = store.activeTour!.tour;
    return [tour, tour.steps[store.activeTour!.step]];
  }

  updateTour(tour: onboardtour) {
    const tourUri = Uri.parse(tour.id);

    const newTour = {
      ...tour
    };
    delete newTour.id;

    const contents = JSON.stringify(newTour, null, 2);
    workspace.fs.writeFile(tourUri, new Buffer(contents));
  }

  async readFile(uri: Uri): Promise<Uint8Array> {
    const [, { contents }] = this.getCurrentTourStep();
    return new Buffer(contents!);
  }

  async writeFile(
    uri: Uri,
    content: Uint8Array,
    options: { create: boolean; overwrite: boolean }
  ): Promise<void> {
    const [tour, step] = this.getCurrentTourStep();
    step.contents = content.toString();
    this.updateTour(tour);
  }

  async stat(uri: Uri): Promise<FileStat> {
    return {
      type: FileType.File,
      ctime: 0,
      mtime: ++this.count,
      size: 100
    };
  }

  async rename(
    oldUri: Uri,
    newUri: Uri,
    options: { overwrite: boolean }
  ): Promise<void> {
    const [tour, step] = this.getCurrentTourStep();
    step.file = path.basename(newUri.toString());
    this.updateTour(tour);
  }

  // Unimplemented members

  private _onDidChangeFile = new EventEmitter<FileChangeEvent[]>();
  public readonly onDidChangeFile: Event<FileChangeEvent[]> = this
    ._onDidChangeFile.event;

  async copy?(
    source: Uri,
    destination: Uri,
    options: { overwrite: boolean }
  ): Promise<void> {
    throw FileSystemError.NoPermissions(
      "onboardtour doesn't support copying files."
    );
  }

  createDirectory(uri: Uri): void {
    throw FileSystemError.NoPermissions(
      "onboardtour doesn't support directories."
    );
  }

  async delete(uri: Uri, options: { recursive: boolean }): Promise<void> {
    throw FileSystemError.NoPermissions(
      "onboardtour doesn't support deleting files."
    );
  }

  async readDirectory(uri: Uri): Promise<[string, FileType][]> {
    throw FileSystemError.NoPermissions(
      "onboardtour doesnt support directories."
    );
  }

  watch(
    uri: Uri,
    options: { recursive: boolean; excludes: string[] }
  ): Disposable {
    throw FileSystemError.NoPermissions(
      "onboardtour doesn't support watching files."
    );
  }
}

export function registerFileSystemProvider() {
  workspace.registerFileSystemProvider(
    FS_SCHEME,
    new onboardtourFileSystemProvider()
  );
}
