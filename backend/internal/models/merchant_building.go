package models

import "math"

type MerchantBuildingBadge struct {
	Label string `json:"label"`
	Tone  string `json:"tone"`
}

type MerchantBuilding struct {
	Stage               string                  `json:"stage"`
	Title               string                  `json:"title"`
	Floors              int64                   `json:"floors"`
	Score               int64                   `json:"score"`
	NextScore           int64                   `json:"nextScore"`
	Skin                string                  `json:"skin"`
	CategoryCount       int64                   `json:"categoryCount"`
	MenuItemCount       int64                   `json:"menuItemCount"`
	CompletedOrderCount int64                   `json:"completedOrderCount"`
	Badges              []MerchantBuildingBadge `json:"badges"`
}

func BuildMerchantBuilding(reviewCount int64, averageRating float64, categoryCount, menuItemCount, completedOrderCount int64) *MerchantBuilding {
	score := reviewCount*5 +
		int64(math.Round(averageRating*4)) +
		categoryCount*3 +
		minInt64(menuItemCount, 10) +
		minInt64(completedOrderCount, 20)*2

	floors := int64(1)
	switch {
	case score >= 60:
		floors = 10
	case score >= 48:
		floors = 8
	case score >= 36:
		floors = 6
	case score >= 24:
		floors = 4
	case score >= 12:
		floors = 2
	}

	stage := "木屋"
	title := "起步店屋"
	nextScore := int64(12)
	skin := "oak"
	switch {
	case floors >= 10:
		stage = "高樓大廈"
		title = "城市地標館"
		nextScore = score
		skin = "glass"
	case floors >= 6:
		stage = "商圈塔樓"
		title = "商圈成長塔"
		nextScore = 60
		skin = "copper"
	case floors >= 4:
		stage = "社群公寓"
		title = "口碑公寓館"
		nextScore = 48
		skin = "sand"
	case floors >= 2:
		stage = "雙層店屋"
		title = "蓋樓小館"
		nextScore = 24
		skin = "brick"
	}

	badges := make([]MerchantBuildingBadge, 0, 4)
	if averageRating >= 4.5 {
		badges = append(badges, MerchantBuildingBadge{Label: "高星口碑", Tone: "gold"})
	}
	if reviewCount >= 5 {
		badges = append(badges, MerchantBuildingBadge{Label: "人氣店家", Tone: "orange"})
	}
	if categoryCount >= 3 {
		badges = append(badges, MerchantBuildingBadge{Label: "多元評價", Tone: "blue"})
	}
	if floors >= 6 {
		badges = append(badges, MerchantBuildingBadge{Label: "建築升級", Tone: "emerald"})
	}

	return &MerchantBuilding{
		Stage:               stage,
		Title:               title,
		Floors:              floors,
		Score:               score,
		NextScore:           nextScore,
		Skin:                skin,
		CategoryCount:       categoryCount,
		MenuItemCount:       menuItemCount,
		CompletedOrderCount: completedOrderCount,
		Badges:              badges,
	}
}

func minInt64(left, right int64) int64 {
	if left < right {
		return left
	}
	return right
}
