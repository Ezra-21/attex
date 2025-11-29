package usecase

import (
	"context"
	"fmt"

	"focus-astu-hub/internal/domain"
)

type SquadUseCase struct {
	squads   domain.SquadRepository
	problems domain.ProblemRepository
}

func NewSquadUseCase(squads domain.SquadRepository, problems domain.ProblemRepository) *SquadUseCase {
	return &SquadUseCase{squads: squads, problems: problems}
}

func (uc *SquadUseCase) CreateTrack(ctx context.Context, callerSquadID, squadID, title string) (*domain.SquadTrack, error) {
	if callerSquadID != squadID {
		return nil, fmt.Errorf("forbidden: squad mismatch")
	}
	return uc.squads.CreateTrack(ctx, &domain.SquadTrack{SquadID: squadID, Title: title})
}

func (uc *SquadUseCase) GetCurriculum(ctx context.Context, squadID string) ([]*domain.SquadTrack, error) {
	tracks, err := uc.squads.GetTracks(ctx, squadID)
	if err != nil {
		return nil, err
	}

	for _, track := range tracks {
		topics, err := uc.squads.GetTopics(ctx, track.ID)
		if err != nil {
			return nil, err
		}
		for _, topic := range topics {
			problems, err := uc.squads.GetTopicProblems(ctx, topic.ID)
			if err != nil {
				return nil, err
			}
			topic.Problems = make([]domain.TopicProblem, len(problems))
			for i, p := range problems {
				topic.Problems[i] = *p
			}
		}
		track.Topics = make([]domain.SquadTopic, len(topics))
		for i, t := range topics {
			track.Topics[i] = *t
		}
	}
	return tracks, nil
}

func (uc *SquadUseCase) AddTopic(ctx context.Context, callerSquadID, trackID, title string) (*domain.SquadTopic, error) {
	track, err := uc.squads.GetTrackByID(ctx, trackID)
	if err != nil {
		return nil, err
	}
	if track.SquadID != callerSquadID {
		return nil, fmt.Errorf("forbidden: track belongs to different squad")
	}
	return uc.squads.CreateTopic(ctx, &domain.SquadTopic{TrackID: trackID, Title: title})
}

func (uc *SquadUseCase) AssignProblem(ctx context.Context, callerSquadID, topicID, problemID string) error {
	topic, err := uc.squads.GetTopicByID(ctx, topicID)
	if err != nil {
		return err
	}
	track, err := uc.squads.GetTrackByID(ctx, topic.TrackID)
	if err != nil {
		return err
	}
	if track.SquadID != callerSquadID {
		return fmt.Errorf("forbidden: topic belongs to different squad")
	}
	// Verify problem exists
	if _, err := uc.problems.GetByID(ctx, problemID); err != nil {
		return fmt.Errorf("problem not found")
	}
	return uc.squads.AssignProblem(ctx, topicID, problemID)
}

func (uc *SquadUseCase) ListSquads(ctx context.Context) ([]*domain.Squad, error) {
	return uc.squads.ListAll(ctx)
}
