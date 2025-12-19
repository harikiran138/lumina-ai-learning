import { redirect } from 'next/navigation';

export default function CreateAssignmentRedirect() {
    redirect('/teacher/assignments?tab=create');
}
