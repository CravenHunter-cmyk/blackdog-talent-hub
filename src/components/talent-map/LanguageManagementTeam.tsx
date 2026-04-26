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
    <div className="mt-5 border-t border-[#d2c8ba] pt-5">
      <div className="mb-3 flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <h3 className="text-lg font-bold text-[#1e1712]">Language Management Team Options</h3>
          <p className="mt-1 text-sm font-medium text-[#6b6258]">Management team combinations for this pool.</p>
        </div>
        <div className="text-sm text-[#6b6258]">
          Current pool:{" "}
          <span className="font-medium text-[#1e1712]">
            {selected.language} - {selected.region}
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-lg border border-[#d2c8ba] bg-white shadow-[0_12px_28px_rgba(31,41,51,0.07)]">
        <table className="w-full min-w-[1120px] border-collapse text-center text-sm">
          <thead className="bg-[#e7ebe1] text-center text-xs uppercase text-[#1f2933]">
            <tr>
              <th className="whitespace-nowrap px-4 py-3">Option</th>
              <th className="whitespace-nowrap px-4 py-3">Coverage</th>
              <th className="whitespace-nowrap px-4 py-3">Project Manager</th>
              <th className="whitespace-nowrap px-4 py-3">Resource Manager</th>
              <th className="whitespace-nowrap px-4 py-3">POC Manager</th>
              <th className="px-4 py-3">Recommended For</th>
              <th className="whitespace-nowrap px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {team.options.map((option) => (
              <tr key={`${option.coverage}-${option.optionName}`} className="border-t border-[#d7cdbf] hover:bg-[#f4f8f0]">
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-[#1e1712]">
                  {option.optionName}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[#6b6258]">{option.coverage}</td>
                <td className="whitespace-nowrap px-4 py-3 text-[#6b6258]">
                  {option.projectManager}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[#6b6258]">
                  {option.resourceManager}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[#6b6258]">{option.pocManager}</td>
                <td className="px-4 py-3 text-[#6b6258]">{option.recommendedFor}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="rounded-md border border-[#9caf88] bg-[#eef3e7] px-2 py-1 text-xs font-bold text-[#214d3a]">
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
