import { TFile, Plugin } from 'obsidian';
import { createNote } from './validator';
import { Linker } from './linker';
import { Tager } from './tager';
import { Repo, IGraph } from '../../repository/repo';
import { Note } from '../../models/note/note';
import { PluginSettings } from '../../settings/settings';

type Graph = IGraph;
type Celestia = IGraph;

interface ObsidianPlugin extends Plugin {
  settings: PluginSettings;
}

export class Updater {
  private plugin: ObsidianPlugin;

  constructor(plugin: ObsidianPlugin) {
    this.plugin = plugin;
  }

  async update(file: TFile, graph: Graph, celestia: Celestia): Promise<void> {
    console.log(`\n---------------------------\n"${file.basename}"\n---------------------------`);

    const repository = new Repo(this.plugin);
    const name = file.basename;
    const text = await this.plugin.app.vault.read(file);
    const note: Note = createNote(name, text, this.plugin);

    const linker = new Linker(repository);
    const tager = new Tager(repository);

    const links = await linker.link(note, graph, celestia);
    const tags = await tager.tag(note, graph, celestia);

    const newText = this.formatNoteText(note, links, tags);
    await this.plugin.app.vault.modify(file, newText);
  }

  private formatNoteText(note: Note, links: string, tags: string): string {
    const separator =
      note.body.length === 0 || note.body.startsWith('\n') || note.body.startsWith('\r')
        ? ''
        : '\n';

    return [links, `\n${tags}\n`, `# ${note.title}${separator}${note.body}`].join('\n');
  }
}
