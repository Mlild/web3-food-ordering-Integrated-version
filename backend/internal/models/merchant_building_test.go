package models

import "testing"

func TestBuildMerchantBuilding(t *testing.T) {
	building := BuildMerchantBuilding(8, 4.8, 4, 6, 5)

	if building == nil {
		t.Fatal("expected building")
	}
	if building.Score <= 0 {
		t.Fatalf("expected positive score, got %d", building.Score)
	}
	if building.Floors < 6 {
		t.Fatalf("expected upgraded building floors, got %d", building.Floors)
	}
	if building.Skin == "" {
		t.Fatal("expected skin")
	}
	if len(building.Badges) == 0 {
		t.Fatal("expected badges")
	}
}
