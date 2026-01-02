package main

import (
	"context"
	"log"

	"focus-astu-hub/internal/config"
	deliveryhttp "focus-astu-hub/internal/delivery/http"
	"focus-astu-hub/internal/pkg/codeforces"
	pgrepo "focus-astu-hub/internal/repository/postgres"
	"focus-astu-hub/internal/usecase"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	ctx := context.Background()

	// ── JWKS — fetch before anything else so the first request never misses ──
	jwks := deliveryhttp.NewJWKSCache(cfg.JWKSUrl)
	if err := jwks.Fetch(ctx); err != nil {
		log.Fatalf("JWKS fetch: %v", err)
	}
	jwks.StartRefreshLoop()

	// ── Database ─────────────────────────────────────────────────────────────
	db, err := pgrepo.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database connection: %v", err)
	}
	defer db.Close()

	// ── Repositories ─────────────────────────────────────────────────────────
	userRepo         := pgrepo.NewUserRepo(db)
	problemRepo      := pgrepo.NewProblemRepo(db)
	submissionRepo   := pgrepo.NewSubmissionRepo(db)
	contestRepo      := pgrepo.NewContestRepo(db)
	squadRepo        := pgrepo.NewSquadRepo(db)
	editorialRepo    := pgrepo.NewEditorialRepo(db)
	announcementRepo := pgrepo.NewAnnouncementRepo(db)
	invitationRepo   := pgrepo.NewInvitationRepo(db)
	settingsRepo     := pgrepo.NewSystemSettingsRepo(db)

	// ── Use cases ────────────────────────────────────────────────────────────
	verseUC        := usecase.NewVerseUseCase()
	userUC         := usecase.NewUserUseCase(userRepo)
	adminUserUC    := usecase.NewAdminUserUseCase(userRepo, squadRepo)
	problemUC      := usecase.NewProblemUseCase(problemRepo)
	submissionUC   := usecase.NewSubmissionUseCase(userRepo, problemRepo, submissionRepo)
	contestUC      := usecase.NewContestUseCase(contestRepo, userRepo, codeforces.NewClient())
	squadUC        := usecase.NewSquadUseCase(squadRepo, problemRepo)
	editorialUC    := usecase.NewEditorialUseCase(editorialRepo)
	announcementUC := usecase.NewAnnouncementUseCase(announcementRepo)
	invitationUC   := usecase.NewInvitationUseCase(invitationRepo, cfg.SupabaseURL, cfg.SupabaseServiceRoleKey, cfg.SiteURL, cfg.ResendAPIKey, cfg.ResendFrom)

	// Warm verse cache before accepting traffic
	verseUC.WarmCache(ctx)
	verseUC.StartRefreshLoop()

	// ── HTTP handlers ─────────────────────────────────────────────────────────
	publicH    := deliveryhttp.NewPublicHandler(verseUC, announcementUC, userRepo, contestUC, settingsRepo, invitationUC)
	userH      := deliveryhttp.NewUserHandler(userUC)
	submH      := deliveryhttp.NewSubmissionHandler(submissionUC)
	problemH   := deliveryhttp.NewProblemHandler(problemRepo, problemUC)
	contestH   := deliveryhttp.NewContestHandler(contestUC)
	squadH     := deliveryhttp.NewSquadHandler(squadUC)
	editorialH := deliveryhttp.NewEditorialHandler(editorialUC)
	annH       := deliveryhttp.NewAnnouncementHandler(announcementUC)
	adminH     := deliveryhttp.NewAdminHandler(adminUserUC, userUC, invitationUC, settingsRepo, userRepo)

	// ── Server ────────────────────────────────────────────────────────────────
	srv := deliveryhttp.NewServer(
		jwks,
		userRepo,
		publicH, userH, submH, problemH, contestH, squadH, editorialH, annH, adminH,
	)

	log.Printf("starting server on :%s", cfg.Port)
	if err := srv.Start(cfg.Port); err != nil {
		log.Fatalf("server: %v", err)
	}
}
