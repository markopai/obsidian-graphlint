import { IRepo, IGraph } from '../../repository/repo';

class Note {
  name: string;
  words: string[];
  title: string;
  body: string;

  constructor(name: string, text: string) {
    this.name = name;
    this.words = this.parseWords();
    this.title = this.parseTitle();
    this.body = this.parseBody(text);
  }

  private parseWords(): string[] {
    return this.name.split('.');
  }

  private parseTitle(): string {
    return this.words[this.words.length - 1] ?? this.name;
  }

  private parseBody(text: string): string {
    const firstHeaderMatch = text.match(/^# .*/m);

    if (!firstHeaderMatch || firstHeaderMatch.index === undefined) {
      return text;
    }

    const firstHeader = firstHeaderMatch[0].slice(2).trim();
    if (firstHeader !== this.title) {
      return text;
    }

    return text.slice(firstHeaderMatch.index + firstHeaderMatch[0].length);
  }

  async findFounder(
    repo: IRepo,
    graph: IGraph,
    _celestia: IGraph
  ): Promise<[string, string] | null> {
    const founderName = this.words[0];

    console.log(`Note founder: "${founderName}"`);
    return await repo.find(graph, founderName, true);
  }

  async findFather(repo: IRepo, graph: IGraph, celestia: IGraph): Promise<[string, string] | null> {
    if (this.words.length > 1) {
      const fatherName = this.words.slice(0, -1).join('.');
      const fatherTitle = this.words[this.words.length - 2] ?? fatherName;

      console.log(`Note father: "${fatherName}" (stub)`);

      // Возвращаем болванку без поиска файла
      return [fatherName, `# ${fatherTitle}\n`];
    }
    return this.findFounder(repo, graph, celestia);
  }
}

export { Note };
