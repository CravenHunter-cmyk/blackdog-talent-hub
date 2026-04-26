import { languageManagementTeams } from "@/data/languageManagementTeams";
import type { LanguageResource } from "@/types/talent";

type LanguageManagementTeamProps = {
  selected: LanguageResource;
};

export function LanguageManagementTeam({ selected }: LanguageManagementTeamProps) {
  const exactTeam = languageManagementTeams.find(
    (item) => item.language === selected.language && item.region === selected.region,
  );
  const languageDefaultTeam = languageManagementTeams.find(
    (item) => item.language === selected.language && !item.region,
  );
  const globalBackupTeam = languageManagementTeams.find((item) => item.language === "Global Backup");
  const team = exactTeam ?? languageDefaultTeam ?? globalBackupTeam;

  if (!team) return null;

  return (
    <div className="mt-5 border-t border-gray-200 pt-5">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-950">Language Management Team Options</h3>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          Select a preferred management team for this language pool. Each team combines project
          execution, resource coordination, and client communication roles.
        </p>
      </div>

      <div className="mb-3 text-sm text-gray-700">
        Current pool:{" "}
        <span className="font-medium text-gray-950">
          {selected.language} - {selected.region}
        </span>
      </div>

      <div className="overflow-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[880px] border-collapse text-left text-sm">
          <thead className="bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3">Option</th>
              <th className="px-4 py-3">Coverage</th>
              <th className="px-4 py-3">Project Manager</th>
              <th className="px-4 py-3">Resource Manager</th>
              <th className="px-4 py-3">POC Manager</th>
              <th className="px-4 py-3">Recommended For</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {team.options.map((option) => (
              <tr key={`${option.coverage}-${option.optionName}`} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-950">{option.optionName}</td>
                <td className="px-4 py-3 text-gray-700">{option.coverage}</td>
                <td className="px-4 py-3 text-gray-700">{option.projectManager}</td>
                <td className="px-4 py-3 text-gray-700">{option.resourceManager}</td>
                <td className="px-4 py-3 text-gray-700">{option.pocManager}</td>
                <td className="px-4 py-3 text-gray-700">{option.recommendedFor}</td>
                <td className="px-4 py-3">
                  <span className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700">
                    {option.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
