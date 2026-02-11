import { Plugin, TFile } from 'obsidian';
import { PluginSettings } from '../settings/settings';

export interface IGraph {
  files: TFile[];
  path: string;
  alias: {
    founder: string;
    ancestor: string;
    father: string;
  };
}

export interface IRepo {
  plugin: Plugin & { settings: PluginSettings };

  find(graph: IGraph, name: string, create?: boolean): Promise<[string, string] | null>;

  createGraph(
    files: TFile[],
    path: string,
    alias: { founder: string; ancestor: string; father: string }
  ): IGraph;
}

export class Repo implements IRepo {
  plugin: Plugin & { settings: PluginSettings };

  constructor(plugin: Plugin & { settings: PluginSettings }) {
    this.plugin = plugin;
  }

  async find(
    graph: IGraph,
    name: string,
    create: boolean = true
  ): Promise<[string, string] | null> {
    let reqFile: TFile | undefined;

    if (graph.path.includes('Void') && name.split('.').length === 1) {
      reqFile = graph.files.find((file) => file.basename === name);
    } else {
      reqFile = graph.files.find((file) => file.basename.endsWith(name));
    }

    if (!reqFile) {
      if (create) {
        reqFile = await this.createAndUpdateFile(graph, name);

        // Даем Obsidian время на индексацию нового файла
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Перечитываем файл из хранилища для гарантии актуальности
        const freshFile = this.plugin.app.vault.getAbstractFileByPath(reqFile.path);
        if (freshFile instanceof TFile) {
          reqFile = freshFile;
        }
      } else {
        console.error(`Не удалось найти: "${name}" в "${graph.path}"`);
        return null;
      }
    }

    const reqFileName = reqFile.basename;
    const reqFileText = await this.plugin.app.vault.read(reqFile);

    return [reqFileName, reqFileText];
  }

  private async createAndUpdateFile(graph: IGraph, name: string): Promise<TFile> {
    let createdFile: TFile;

    try {
      createdFile = await this.plugin.app.vault.create(graph.path + name + '.md', '\n# temp');
      console.log(`Заметка "${name}" создана в "${graph.path}"`);
    } catch (error) {
      console.error(`Ошибка создания "${name}": ${error}`);
      throw error;
    }

    const insertIndex = graph.files.findIndex(
      (file) => file.basename.localeCompare(createdFile.basename) > 0
    );
    if (insertIndex === -1) {
      graph.files.push(createdFile);
    } else {
      graph.files.splice(insertIndex, 0, createdFile);
    }

    return createdFile;
  }

  createGraph(
    files: TFile[],
    path: string,
    alias: { founder: string; ancestor: string; father: string }
  ): IGraph {
    return {
      files,
      path,
      alias,
    };
  }
}
