import { languageManagementTeams } from "@/data/languageManagementTeams";
import { PawSectionIcon } from "@/components/talent-map/PawSectionIcon";
import type { LanguageResource } from "@/types/talent";

type LanguageManagementTeamProps = {
  selected: LanguageResource;
};

function statusBadgeClass(status: string) {
  if (status === "Recommended") {
    return "border-[rgba(25,200,180,0.30)] bg-[rgba(25,200,180,0.15)] text-[#8ff7e8]";
  }

  if (status === "Available") {
    return "border-[rgba(31,123,255,0.32)] bg-[rgba(31,123,255,0.16)] text-[#9dccff]";
  }

  return "border-[rgba(245,158,27,0.34)] bg-[rgba(245,158,27,0.16)] text-[#ffd68a]";
}

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
    <div className="talent-management-team mt-6 border-t border-[rgba(90,170,255,0.09)] pt-5">
      <div className="mb-3 flex flex-col justify-between gap-2 md:flex-row md:items-center">
        <div className="talent-map-section-heading talent-section-heading talent-section-heading--management">
          <PawSectionIcon className="talent-map-section-spark talent-section-heading__icon" />
          <div className="talent-section-heading__copy">
            <h3>Language Management Team Options</h3>
            <p>Management team combinations for this pool.</p>
          </div>
        </div>
        <div className="text-sm text-[rgba(207,229,255,0.66)]">
          Current pool:{" "}
          <span className="font-medium text-[#f7fbff]">
            {selected.language} - {selected.region}
          </span>
        </div>
      </div>

      <div className="scroll-x-panel talent-management-team-table w-full overflow-hidden rounded-[20px] border border-[rgba(90,170,255,0.12)] bg-[rgba(3,15,32,0.72)] shadow-[0_18px_50px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-[16px]">
        <table className="data-table min-w-[1120px]">
          <thead>
            <tr>
              <th className="th-left">Team</th>
              <th className="th-center">Coverage</th>
              <th className="th-left">Project Manager</th>
              <th className="th-left">Resource Manager</th>
              <th className="th-left">POC Manager</th>
              <th className="th-left">Recommended For</th>
              <th className="th-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {team.options.map((option) => (
              <tr key={`${option.coverage}-${option.optionName}`} className="border-t border-[rgba(90,170,255,0.10)] hover:bg-[rgba(90,170,255,0.08)]">
                <td className="td-left whitespace-nowrap font-semibold text-[#f7fbff]">
                  {option.optionName}
                </td>
                <td className="td-center whitespace-nowrap text-[rgba(207,229,255,0.66)]">{option.coverage}</td>
                <td className="td-left whitespace-nowrap text-[rgba(207,229,255,0.66)]">
                  {option.projectManager}
                </td>
                <td className="td-left whitespace-nowrap text-[rgba(207,229,255,0.66)]">
                  {option.resourceManager}
                </td>
                <td className="td-left whitespace-nowrap text-[rgba(207,229,255,0.66)]">{option.pocManager}</td>
                <td className="td-left text-[rgba(207,229,255,0.66)]">{option.recommendedFor}</td>
                <td className="td-center whitespace-nowrap">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusBadgeClass(option.status)}`}>
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
