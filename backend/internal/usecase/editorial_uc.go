package usecase

import (
	"context"

	"focus-astu-hub/internal/domain"
)

type EditorialUseCase struct {
	editorials domain.EditorialRepository
}

func NewEditorialUseCase(editorials domain.EditorialRepository) *EditorialUseCase {
	return &EditorialUseCase{editorials: editorials}
}

func (uc *EditorialUseCase) Create(ctx context.Context, userID, problemID, content string) (*domain.Editorial, error) {
	return uc.editorials.Create(ctx, &domain.Editorial{
		ProblemID: problemID,
		UserID:    userID,
		ContentMD: content,
	})
}

func (uc *EditorialUseCase) ListByProblem(ctx context.Context, problemID, callerID string) ([]*domain.Editorial, error) {
	return uc.editorials.ListByProblem(ctx, problemID, callerID)
}

func (uc *EditorialUseCase) Update(ctx context.Context, editorialID, userID, content string) error {
	return uc.editorials.Update(ctx, &domain.Editorial{
		ID:        editorialID,
		UserID:    userID,
		ContentMD: content,
	})
}

func (uc *EditorialUseCase) Delete(ctx context.Context, editorialID, userID string) error {
	return uc.editorials.Delete(ctx, editorialID, userID)
}

func (uc *EditorialUseCase) Vote(ctx context.Context, editorialID, userID string, value int) error {
	return uc.editorials.ToggleVote(ctx, editorialID, userID, value)
}
