import Fusion from '../fusion/fusion-model.mjs'

export const removeGemReferencesFromFusions = async (gemID) => {
	await Fusion.updateMany({ gems: gemID }, { $pull: { gems: gemID } })
}
