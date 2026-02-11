import { Periodic } from '../periodic';
import { IRepo, IGraph } from '../../../../repository/repo';

class Weekly extends Periodic {
  override async findFounder(
    repo: IRepo,
    GRAPH: IGraph,
    CELESTIA: IGraph
  ): Promise<[string, string] | null> {
    const plugin = repo.plugin;

    if (this.name === plugin.settings.periodic.templates.weekly) {
      return await repo.find(CELESTIA, plugin.settings.periodic.celestia_paths.weekly);
    }

    return await repo.find(GRAPH, plugin.settings.periodic.templates.weekly);
  }

  override async findFather(
    repo: IRepo,
    GRAPH: IGraph,
    CELESTIA: IGraph
  ): Promise<[string, string] | null> {
    return this.findFounder(repo, GRAPH, CELESTIA);
  }
}

export { Weekly };
