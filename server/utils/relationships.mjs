import Gem from '../gem/gem-model.mjs'
import Fusion from '../fusion/fusion-model.mjs'

export const syncFusionGemReferences = async (fusionID, gemIDs) => {
	await Gem.updateMany({ fusions: fusionID }, { $pull: { fusions: fusionID } })
	if (gemIDs.length > 0) {
		await Gem.updateMany(
			{ _id: { $in: gemIDs } },
			{ $addToSet: { fusions: fusionID } },
		)
	}
}

export const removeGemReferencesFromFusions = async (gemID) => {
	await Fusion.updateMany({ gems: gemID }, { $pull: { gems: gemID } })
}
