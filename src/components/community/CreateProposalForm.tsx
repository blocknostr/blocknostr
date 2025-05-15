
const onSubmit = async (data: z.infer<typeof formSchema>) => {
  if (options.length < 2) {
    toast.error("You need at least two options");
    return;
  }
  
  setIsSubmitting(true);
  
  try {
    // Log authentication status
    console.log("Creating proposal with auth status:", { 
      isLoggedIn: !!nostrService.publicKey,
      publicKey: nostrService.publicKey
    });
    
    // Calculate the end date based on duration
    const durationDays = parseInt(data.duration);
    const endsAt = Math.floor(Date.now() / 1000) + (durationDays * 24 * 60 * 60);
    
    if (!communityId) {
      toast.error("Invalid community ID");
      setIsSubmitting(false);
      return;
    }
    
    // Create the proposal with correct parameters per NIP-172
    const result = await nostrService.createProposal(
      communityId,
      data.title,
      data.description,
      options,
      data.category as ProposalCategory
    );
    
    if (result) {
      toast.success("Proposal created successfully!");
      form.reset();
      setOptions(["Yes", "No"]);
      onProposalCreated();
    } else {
      toast.error("Failed to create proposal. Please make sure you're logged in and have selected a valid community.");
    }
  } catch (error) {
    console.error("Error creating proposal:", error);
    toast.error(error instanceof Error ? error.message : "Failed to create proposal");
  } finally {
    setIsSubmitting(false);
  }
};
