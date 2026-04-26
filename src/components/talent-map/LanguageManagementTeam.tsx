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
    <div className="mt-5 border-t border-[#e2d8c8] pt-5">
      <div className="mb-3 flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <h3 className="text-lg font-bold text-[#111827]">Language Management Team Options</h3>
          <p className="mt-1 text-sm font-medium text-[#6f6256]">Management team combinations for this pool.</p>
        </div>
        <div className="text-sm text-[#6f6256]">
          Current pool:{" "}
          <span className="font-medium text-[#111827]">
            {selected.language} - {selected.region}
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-lg border border-[#e2d8c8] bg-white shadow-[0_12px_28px_rgba(31,41,51,0.08)]">
        <table className="w-full min-w-[1120px] border-collapse text-center text-sm">
          <thead className="bg-[#f1ece3] text-center text-xs uppercase text-[#1e1712]">
            <tr>
              <th className="border-b border-[#e2d8c8] whitespace-nowrap px-4 py-3">Option</th>
              <th className="border-b border-[#e2d8c8] whitespace-nowrap px-4 py-3">Coverage</th>
              <th className="border-b border-[#e2d8c8] whitespace-nowrap px-4 py-3">Project Manager</th>
              <th className="border-b border-[#e2d8c8] whitespace-nowrap px-4 py-3">Resource Manager</th>
              <th className="border-b border-[#e2d8c8] whitespace-nowrap px-4 py-3">POC Manager</th>
              <th className="border-b border-[#e2d8c8] px-4 py-3">Recommended For</th>
              <th className="border-b border-[#e2d8c8] whitespace-nowrap px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {team.options.map((option) => (
              <tr key={`${option.coverage}-${option.optionName}`} className="border-t border-[#e1e4dd] hover:bg-[#f3f7f0]">
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-[#111827]">
                  {option.optionName}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[#6f6256]">{option.coverage}</td>
                <td className="whitespace-nowrap px-4 py-3 text-[#6f6256]">
                  {option.projectManager}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[#6f6256]">
                  {option.resourceManager}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[#6f6256]">{option.pocManager}</td>
                <td className="px-4 py-3 text-[#6f6256]">{option.recommendedFor}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="rounded-md border border-[#1f5c43] bg-[#f3f7f0] px-2 py-1 text-xs font-bold text-[#1f5c43]">
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
